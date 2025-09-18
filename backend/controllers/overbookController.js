import { Op } from 'sequelize';
import OverbookSuggestion from '../models/OverbookSuggestion.js';
import Schedule from '../models/Schedule.js';
import Waitlist from '../models/Waitlist.js';
import OverbookConfig from '../models/OverbookConfig.js';
import crypto from 'crypto';
import { sendMail } from '../utils/mailer.js';
import { io } from '../server.js';

function scoreRisk({ department, dateTime }) {
  const date = new Date(dateTime);
  const hour = date.getHours();
  let base = 0.3; // base show probability
  if (hour >= 7 && hour <= 10) base += 0.2;
  if (hour >= 17 || hour <= 8) base -= 0.05;
  if (/derm|orth/i.test(department)) base += 0.05;
  if (/emerg|onco/i.test(department)) base -= 0.05;
  const confidence = Math.min(0.9, Math.max(0.4, base + (Math.random()-0.5)*0.1));
  const risk = confidence > 0.55 ? 'low' : confidence > 0.48 ? 'medium' : 'high';
  return { risk, confidence };
}

export const listSuggestions = async (req, res) => {
  try {
    const { startDate, endDate, doctorName, department } = req.query;
    const where = { status: 'suggested' };
    if (startDate && endDate) where.dateTime = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    if (doctorName) where.doctorName = doctorName;
    if (department) where.department = department;
    const rows = await OverbookSuggestion.findAll({ where, order: [['dateTime','ASC']] });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list suggestions' });
  }
};

export async function generateSuggestionsInternal({ startDate, endDate, doctorName, department } = {}) {
  const where = {};
  if (startDate && endDate) where.dateTime = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  if (doctorName) where.doctorName = doctorName;
  if (department) where.department = department;
  const slots = await Schedule.findAll({ where, limit: 200 });
  const created = [];
  for (const s of slots) {
    const { risk, confidence } = scoreRisk({ department: s.department, dateTime: s.dateTime });
    if (risk !== 'low') continue;
    const exists = await OverbookSuggestion.findOne({ where: { doctorName: s.doctorName, department: s.department, dateTime: s.dateTime, status: 'suggested' } });
    if (exists) continue;
    const row = await OverbookSuggestion.create({ doctorName: s.doctorName, department: s.department, dateTime: s.dateTime, risk, confidence });
    created.push(row);
  }
  if (created.length) io.emit('overbook_suggestions', created);
  return { created: created.length };
}

export const generateSuggestions = async (req, res) => {
  try {
    const result = await generateSuggestionsInternal(req.body || {});
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

export const acceptSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const sug = await OverbookSuggestion.findByPk(id);
    if (!sug || sug.status !== 'suggested') return res.status(404).json({ error: 'Not found' });
    sug.status = 'accepted';
    sug.acceptedByUserId = req.user?.id || null;
    await sug.save();
    io.emit('overbook_accepted', { id: sug.id });
    res.json(sug);
  } catch (e) {
    res.status(500).json({ error: 'Failed to accept suggestion' });
  }
};

export const declineSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const sug = await OverbookSuggestion.findByPk(id);
    if (!sug || sug.status !== 'suggested') return res.status(404).json({ error: 'Not found' });
    sug.status = 'declined';
    await sug.save();
    io.emit('overbook_declined', { id: sug.id });
    res.json(sug);
  } catch (e) {
    res.status(500).json({ error: 'Failed to decline suggestion' });
  }
};

export const joinWaitlist = async (req, res) => {
  try {
    const { patientName, patientEmail, department, doctorName } = req.body;
    const row = await Waitlist.create({ patientName, patientEmail, department, doctorName, priority: 0, status: 'waiting' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
};

export async function getConfigInternal() {
  const [cfg] = await OverbookConfig.findOrCreate({ where: { id: 1 }, defaults: {} });
  return cfg;
}

export const inviteTopCandidate = async (req, res) => {
  try {
    const { department, doctorName, dateTime } = req.body;
    if (!department || !dateTime) return res.status(400).json({ error: 'department and dateTime required' });
  const cfg = await getConfigInternal();
    const candidate = await Waitlist.findOne({ where: { department, doctorName: doctorName || null, status: 'waiting' }, order: [['priority','DESC'], ['createdAt','ASC']] });
    if (!candidate) return res.status(404).json({ error: 'No candidates' });
    const token = crypto.randomBytes(24).toString('hex');
    const holdMs = (cfg.holdMinutes || 20) * 60 * 1000;
    candidate.status = 'invited';
    candidate.inviteToken = token;
    candidate.holdExpiresAt = new Date(Date.now() + holdMs);
    candidate.invitedSlotDateTime = new Date(dateTime);
    await candidate.save();
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${FRONTEND_URL}/overbook/confirm?token=${token}`;
    const { previewUrl } = await sendMail({
      to: candidate.patientEmail || 'no-reply@example.com',
      subject: 'Appointment slot available',
      html: `<p>Hello ${candidate.patientName},</p><p>A ${department} slot is available ${new Date(dateTime).toLocaleString()}. Click to claim within ${cfg.holdMinutes} minutes:</p><p><a href="${link}">${link}</a></p>`
    });
    if (res) return res.json({ invited: candidate.id, previewUrl });
  } catch (e) {
    if (res) return res.status(500).json({ error: 'Failed to invite' });
  }
};

export const confirmInvite = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) return res.status(400).json({ error: 'token required' });
    const invite = await Waitlist.findOne({ where: { inviteToken: token, status: 'invited' } });
    if (!invite) return res.status(404).json({ error: 'Invalid or used token' });
    if (invite.holdExpiresAt && new Date(invite.holdExpiresAt).getTime() < Date.now()) {
      invite.status = 'expired';
      await invite.save();
      return res.status(410).json({ error: 'Invite expired' });
    }
    // Check existing schedules in the hour for the doctor
    const slot = new Date(invite.invitedSlotDateTime);
    const start = new Date(slot.getTime() - 60*60*1000);
    const end = new Date(slot.getTime() + 60*60*1000);
    const count = await Schedule.count({ where: { doctorName: invite.doctorName, dateTime: { [Op.gt]: start, [Op.lt]: end } } });
  const cfg = await getConfigInternal();
    let overbooked = false;
    if (count >= 1) {
      if (cfg.maxPerHour && count < cfg.maxPerHour) {
        overbooked = true;
      } else {
        return res.status(409).json({ error: 'Slot not available' });
      }
    }
    const schedule = await Schedule.create({
      doctorName: invite.doctorName || 'TBD',
      patientName: invite.patientName,
      department: invite.department,
      dateTime: slot,
      userId: req.user?.id || null,
      overbooked,
    });
    invite.status = 'confirmed';
    await invite.save();
    io.emit('new_schedule', schedule);
    return res.json({ confirmed: true, schedule });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to confirm invite' });
  }
};

export const getConfig = async (req, res) => {
  const cfg = await getConfigInternal();
  res.json(cfg);
};

export const updateConfig = async (req, res) => {
  const cfg = await getConfigInternal();
  const { enabled, riskThreshold, maxPerHour, holdMinutes } = req.body || {};
  if (enabled !== undefined) cfg.enabled = !!enabled;
  if (riskThreshold) cfg.riskThreshold = riskThreshold;
  if (maxPerHour !== undefined) cfg.maxPerHour = Math.max(0, parseInt(maxPerHour));
  if (holdMinutes !== undefined) cfg.holdMinutes = Math.max(5, parseInt(holdMinutes));
  await cfg.save();
  res.json(cfg);
};

export async function inviteTopCandidateInternal({ department, doctorName, dateTime }) {
  const cfg = await getConfigInternal();
  const candidate = await Waitlist.findOne({ where: { department, doctorName: doctorName || null, status: 'waiting' }, order: [['priority','DESC'], ['createdAt','ASC']] });
  if (!candidate) return { invited: false };
  const token = crypto.randomBytes(24).toString('hex');
  const holdMs = (cfg.holdMinutes || 20) * 60 * 1000;
  candidate.status = 'invited';
  candidate.inviteToken = token;
  candidate.holdExpiresAt = new Date(Date.now() + holdMs);
  candidate.invitedSlotDateTime = new Date(dateTime);
  await candidate.save();
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${FRONTEND_URL}/overbook/confirm?token=${token}`;
  await sendMail({ to: candidate.patientEmail || 'no-reply@example.com', subject: 'Appointment slot available', html: `<p>Hello ${candidate.patientName},</p><p>A ${department} slot is available ${new Date(dateTime).toLocaleString()}.</p><p><a href="${link}">Claim your slot</a> within ${cfg.holdMinutes} minutes.</p>` });
  return { invited: true };
}
