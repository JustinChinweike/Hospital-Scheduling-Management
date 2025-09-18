import React, { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { toast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ChevronLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { overbookAPI } from '../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DEPARTMENTS } from '../lib/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { schedules, fetchSchedules, updateSchedule, createSchedule, deleteSchedule } = useSchedule();
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const lastRangeRef = useRef<{ start?: Date; end?: Date }>({});
  const socketRef = useRef<Socket | null>(null);
  const [creating, setCreating] = useState<{ open: boolean; start?: Date; end?: Date }>({ open: false });
  const [form, setForm] = useState({ doctorName: '', patientName: '', department: 'General' });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [decision, setDecision] = useState<{ open: boolean; sug?: any }>(() => ({ open: false }));
  const [backfill, setBackfill] = useState<{ open: boolean; slot?: Date; department: string; doctorName: string; inviting: boolean; previewUrl?: string }>({ open: false, department: 'General', doctorName: '', inviting: false });
  const [detail, setDetail] = useState<{ open: boolean; item?: any; editing?: boolean }>(() => ({ open: false }));
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [docFilter, setDocFilter] = useState<string>('');
  const [initialView, setInitialView] = useState<string>(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'timeGridDay' : 'timeGridWeek'));
  

  const doctorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of schedules) if (s.doctorName) set.add(s.doctorName);
    return Array.from(set).sort();
  }, [schedules]);

  useEffect(() => {
    // Initialize filters from URL if present
    const dept = searchParams.get('department');
    const doc = searchParams.get('doctor');
    if (dept) setDeptFilter(dept);
    if (doc) setDocFilter(doc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({ title: 'Authentication Required', description: 'Please login to access the calendar', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    // initial load: current week
    const start = new Date();
    start.setDate(start.getDate() - 3);
    const end = new Date();
    end.setDate(end.getDate() + 10);
    const filters: any = { startDate: start.toISOString(), endDate: end.toISOString() };
    if (deptFilter && deptFilter !== 'all') filters.department = deptFilter;
    if (docFilter) filters.doctorName = docFilter;
    fetchSchedules(1, filters, 500);
  }, [isAuthenticated]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    const refreshInView = () => {
      const { start, end } = lastRangeRef.current;
      if (start && end) {
        const filters: any = { startDate: start.toISOString(), endDate: end.toISOString() };
        if (deptFilter && deptFilter !== 'all') filters.department = deptFilter;
        if (docFilter) filters.doctorName = docFilter;
        fetchSchedules(1, filters, 1000);
        if (localStorage.getItem('token')) {
          overbookAPI.listSuggestions(localStorage.getItem('token')!, { startDate: start.toISOString(), endDate: end.toISOString() })
            .then(setSuggestions)
            .catch(()=>{});
        }
      } else {
        fetchSchedules();
      }
    };
    socket.on('new_schedule', refreshInView);
    socket.on('updated_schedule', refreshInView);
    socket.on('deleted_schedule', refreshInView);
    socket.on('overbook_suggestions', refreshInView);
    socket.on('overbook_accepted', refreshInView);
    socket.on('overbook_declined', refreshInView);
    return () => {
      socket.disconnect();
    };
  }, []);

  const events = useMemo(() => {
    const live = schedules.map(s => ({
      id: `sched-${s.id}`,
      title: `${s.department}: ${s.doctorName} - ${s.patientName}`,
      start: s.dateTime,
      end: new Date(new Date(s.dateTime).getTime() + 60 * 60 * 1000).toISOString(),
      extendedProps: {
        kind: 'schedule',
        department: s.department,
        doctorName: s.doctorName,
        patientName: s.patientName,
        dateTime: s.dateTime,
        overbooked: (s as any).overbooked ?? false,
        scheduleId: s.id,
      }
    }));
    const ghost = suggestions.map(s => ({
      id: `sug-${s.id}`,
      title: `Suggest: ${s.department} ${s.doctorName}`,
      start: s.dateTime,
      end: new Date(new Date(s.dateTime).getTime() + 60 * 60 * 1000).toISOString(),
      extendedProps: { department: s.department, kind: 'suggestion', sug: s }
    }));
    return [...live, ...ghost];
  }, [schedules, suggestions]);

  const onEventDrop = async (info: any) => {
    try {
      if (info.event.extendedProps?.kind !== 'schedule') { info.revert(); return; }
      const newStart = info.event.start; // Date
      const idFull = info.event.id as string;
      const id = idFull.startsWith('sched-') ? idFull.slice(6) : idFull;
      const ok = await updateSchedule(id, { dateTime: newStart.toISOString() });
      if (!ok) {
        info.revert();
      } else {
        toast({ title: 'Rescheduled', description: 'Appointment moved successfully.' });
      }
    } catch (e) {
      info.revert();
    }
  };

  const onDatesSet = (arg: any) => {
    setViewDate(arg.start);
    // Range-based fetch to keep events in view
    const start = arg.start as Date;
    const end = arg.end as Date;
    lastRangeRef.current = { start, end };
  const filters: any = { startDate: start.toISOString(), endDate: end.toISOString() };
  if (deptFilter && deptFilter !== 'all') filters.department = deptFilter;
  if (docFilter) filters.doctorName = docFilter;
  fetchSchedules(1, filters, 1000);
    const token = localStorage.getItem('token');
    if (token) {
      overbookAPI.listSuggestions(token, { startDate: start.toISOString(), endDate: end.toISOString() })
        .then(setSuggestions)
        .catch(()=>{});
    }
  };

  const onSelect = (selectInfo: any) => {
    setCreating({ open: true, start: selectInfo.start, end: selectInfo.end });
    setBackfill(s => ({ ...s, slot: selectInfo.start, department: form.department, doctorName: form.doctorName }));
  };

  // Use default event rendering

  const submitCreate = async () => {
    if (!creating.start) { setCreating({ open: false }); return; }
    const ok = await createSchedule({
      doctorName: form.doctorName,
      patientName: form.patientName,
      department: form.department,
      dateTime: creating.start.toISOString(),
    } as any);
    if (!ok) {
      toast({ title: 'Create failed', description: 'Could not create appointment', variant: 'destructive' });
    } else {
      toast({ title: 'Created', description: 'Appointment added.' });
    }
    setCreating({ open: false });
    setForm({ doctorName: '', patientName: '', department: 'General' });
  };

  const eventClassNames = (arg: any) => {
    const deptRaw: string = arg.event.extendedProps?.department || '';
    const d = deptRaw.toLowerCase();
    const canonical =
      d.includes('emerg') || d === 'er' ? 'emergency' :
      d.startsWith('cardio') ? 'cardiology' :
      d.startsWith('neuro') ? 'neurology' :
      d.startsWith('peds') || d.startsWith('ped') ? 'pediatrics' :
      d.startsWith('onco') ? 'oncology' :
      d.startsWith('ortho') ? 'orthopedics' :
      d.startsWith('derm') ? 'dermatology' :
      d.startsWith('radio') ? 'radiology' :
      d.startsWith('uro') ? 'urology' :
      d.startsWith('gyn') || d.startsWith('obgyn') ? 'gynecology' :
      d.startsWith('psych') ? 'psychiatry' :
      d.startsWith('gastro') ? 'gastroenterology' :
      d.startsWith('endo') ? 'endocrinology' :
      d.startsWith('ophth') || d.startsWith('opthal') || d.startsWith('oph') ? 'ophthalmology' :
      d.trim().length ? d.replace(/[^a-z0-9]+/g, '-') : 'general';
    const classes = [`dept-${canonical}`];
    if (arg.event.extendedProps?.kind === 'suggestion') classes.push('fc-suggestion');
    return classes;
  };

  const handleSuggestionClick = (info: any) => {
    if (info.event.extendedProps?.kind === 'suggestion') {
      setDecision({ open: true, sug: info.event.extendedProps.sug });
      return;
    }
    if (info.event.extendedProps?.kind === 'schedule') {
      const ep = info.event.extendedProps || {};
      const item = {
        id: ep.scheduleId,
        doctorName: ep.doctorName,
        patientName: ep.patientName,
        department: ep.department,
        dateTime: ep.dateTime || (info.event.start as Date)?.toISOString?.(),
        overbooked: ep.overbooked,
      };
      setDetail({ open: true, item });
    }
  };

  const saveDetailEdits = async () => {
    if (!detail.item?.id) return;
    const id = String(detail.item.id);
    const payload: any = {
      doctorName: detail.item.doctorName,
      patientName: detail.item.patientName,
      department: detail.item.department,
    };
    if (detail.item.dateTime) payload.dateTime = detail.item.dateTime;
    const ok = await updateSchedule(id, payload);
    if (ok) {
      toast({ title: 'Updated', description: 'Appointment saved.' });
      setDetail(s => ({ ...s, editing: false }));
    }
  };

  const deleteCurrent = async () => {
    if (!detail.item?.id) return;
    const id = String(detail.item.id);
    const ok = await deleteSchedule(id);
    if (ok) {
      setDetail({ open: false });
    }
  };

  const openBackfillForDetail = () => {
    if (!detail.item) return;
    const slot = new Date(detail.item.dateTime);
    setBackfill(s => ({ ...s, open: true, slot, department: detail.item.department, doctorName: detail.item.doctorName }));
  };

  const downloadIcsForDetail = () => {
    if (!detail.item) return;
    const start = new Date(detail.item.dateTime);
    const end = new Date(start.getTime() + 60*60*1000);
    const dt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hospital Scheduler//EN',
      'BEGIN:VEVENT',
      `DTSTAMP:${dt(new Date())}`,
      `DTSTART:${dt(start)}`,
      `DTEND:${dt(end)}`,
      `SUMMARY:${detail.item.department}: ${detail.item.doctorName} - ${detail.item.patientName}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointment.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const acceptCurrentSuggestion = async () => {
    if (!decision.sug) return;
    try {
      const token = localStorage.getItem('token')!;
      await overbookAPI.acceptSuggestion(token, decision.sug.id);
      toast({ title: 'Suggestion accepted', description: 'Marked as accepted.' });
      setDecision({ open: false });
      const { start, end } = lastRangeRef.current;
      if (start && end) {
        const s = await overbookAPI.listSuggestions(token, { startDate: start.toISOString(), endDate: end.toISOString() });
        setSuggestions(s);
      }
    } catch (e: any) {
      toast({ title: 'Failed to accept', description: e?.message || 'Try again', variant: 'destructive' });
    }
  };

  const declineCurrentSuggestion = async () => {
    if (!decision.sug) return;
    try {
      const token = localStorage.getItem('token')!;
      await overbookAPI.declineSuggestion(token, decision.sug.id);
      toast({ title: 'Suggestion declined' });
      setDecision({ open: false });
      const { start, end } = lastRangeRef.current;
      if (start && end) {
        const s = await overbookAPI.listSuggestions(token, { startDate: start.toISOString(), endDate: end.toISOString() });
        setSuggestions(s);
      }
    } catch (e: any) {
      toast({ title: 'Failed to decline', description: e?.message || 'Try again', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen p-4">
      <Button variant="ghost" className="mb-3" onClick={() => navigate('/')}> <ChevronLeft className="mr-1"/> Back</Button>
      <div className="max-w-7xl mx-auto bg-white rounded-md shadow p-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {[
            'cardiology','neurology','pediatrics','orthopedics','dermatology',
            'radiology','emergency','urology','gynecology','psychiatry',
            'gastroenterology','endocrinology','ophthalmology','oncology','general',
          ].map((dept) => (
            <span key={dept} className={`dept-chip dept-${dept}`}>
              <span className="dept-dot" />
              {dept.charAt(0).toUpperCase() + dept.slice(1)}
            </span>
          ))}
        </div>
  {/* Filters */}
  <div className="flex flex-wrap items-end gap-2 mb-3">
          <div className="grid gap-1">
            <Label>Department</Label>
            <Select value={deptFilter} onValueChange={(v)=> setDeptFilter(v)}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {DEPARTMENTS.filter(d=>d!=='General').map(d=> (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Doctor</Label>
            <Input list="doctor-suggestions" value={docFilter} onChange={(e)=> setDocFilter(e.target.value)} placeholder="All" className="w-[220px]" />
            <datalist id="doctor-suggestions">
              {doctorOptions.map(name => (<option key={name} value={name} />))}
            </datalist>
          </div>
          <Button onClick={() => {
            const { start, end } = lastRangeRef.current;
            if (start && end) {
              const filters: any = { startDate: start.toISOString(), endDate: end.toISOString() };
              if (deptFilter && deptFilter !== 'all') filters.department = deptFilter;
              if (docFilter) filters.doctorName = docFilter;
              // Sync filters to URL
              const next = new URLSearchParams();
              if (filters.department) next.set('department', String(filters.department));
              if (filters.doctorName) next.set('doctor', String(filters.doctorName));
              setSearchParams(next);
              fetchSchedules(1, filters, 1000);
            }
          }}>Apply</Button>
          <Button variant="secondary" onClick={() => {
            setDeptFilter('all'); setDocFilter('');
            // Clear URL filters
            setSearchParams(new URLSearchParams());
            const { start, end } = lastRangeRef.current;
            if (start && end) fetchSchedules(1, { startDate: start.toISOString(), endDate: end.toISOString() }, 1000);
          }}>Clear</Button>
        </div>
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          editable={true}
          eventResizableFromStart={true}
          selectable={true}
          events={events}
          eventDrop={onEventDrop}
          eventClick={handleSuggestionClick}
          dateClick={(arg: any) => {
            const native = (arg.jsEvent || arg.nativeEvent) as MouseEvent | undefined;
            if (native && native.button === 2) {
              native.preventDefault();
            }
            const cellDate: Date = arg.date;
            setBackfill(s => ({ ...s, open: true, slot: cellDate, department: form.department, doctorName: form.doctorName }));
          }}
          eventResize={async (info: any) => {
            if (info.event.extendedProps?.kind !== 'schedule') { info.revert(); return; }
            const idFull = info.event.id as string;
            const id = idFull.startsWith('sched-') ? idFull.slice(6) : idFull;
            const newStart = info.event.start as Date;
            const ok = await updateSchedule(id, { dateTime: newStart.toISOString() });
            if (!ok) {
              info.revert();
            } else {
              toast({ title: 'Rescheduled', description: 'Appointment time adjusted.' });
            }
          }}
          height="auto"
          datesSet={onDatesSet}
          select={onSelect}
          eventClassNames={eventClassNames}
        />
        <div className="flex justify-end mt-3">
          <Button variant="outline" onClick={() => setBackfill(s => ({ ...s, open: true }))} disabled={!backfill.slot}>Backfill now</Button>
        </div>
        <Dialog open={decision.open} onOpenChange={(open) => setDecision(s => ({ ...s, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept this overbooking suggestion?</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><b>Doctor:</b> {decision.sug?.doctorName}</div>
              <div><b>Department:</b> {decision.sug?.department}</div>
              <div><b>Time:</b> {decision.sug ? new Date(decision.sug.dateTime).toLocaleString() : ''}</div>
              {decision.sug?.risk ? (
                <div className="opacity-80 text-sm">Suggested by system (level: {decision.sug.risk})</div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDecision({ open: false })}>Cancel</Button>
              <Button variant="destructive" onClick={declineCurrentSuggestion}>Decline</Button>
              <Button onClick={acceptCurrentSuggestion}>Accept</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Appointment Details Dialog */}
        <Dialog open={detail.open} onOpenChange={(open)=> setDetail(s=> ({ ...s, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            {detail.item ? (
              <div className="space-y-3 text-sm">
                <div className="grid gap-1">
                  <Label>Doctor</Label>
                  {!detail.editing ? (
                    <div>{detail.item.doctorName}</div>
                  ) : (
                    <div>
                      <Input list="doctor-suggestions" value={detail.item.doctorName} onChange={(e)=> setDetail(s=> ({ ...s, item: { ...s.item, doctorName: e.target.value } }))} />
                    </div>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label>Patient</Label>
                  {!detail.editing ? (
                    <div>{detail.item.patientName}</div>
                  ) : (
                    <Input value={detail.item.patientName} onChange={(e)=> setDetail(s=> ({ ...s, item: { ...s.item, patientName: e.target.value } }))} />
                  )}
                </div>
                <div className="grid gap-1">
                  <Label>Department</Label>
                  {!detail.editing ? (
                    <div>{detail.item.department}</div>
                  ) : (
                    <Select value={detail.item.department} onValueChange={(v)=> setDetail(s=> ({ ...s, item: { ...s.item, department: v } }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(d=> (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label>Time</Label>
                  {!detail.editing ? (
                    <div>{new Date(detail.item.dateTime).toLocaleString()}</div>
                  ) : (
                    <Input type="datetime-local" value={detail.item.dateTime ? new Date(detail.item.dateTime).toISOString().slice(0,16) : ''} onChange={(e)=> setDetail(s=> ({ ...s, item: { ...s.item, dateTime: new Date(e.target.value).toISOString() } }))} />
                  )}
                </div>
                {detail.item.overbooked ? <div className="text-amber-600"><b>Overbooked:</b> Yes</div> : null}
                <div className="flex gap-2 pt-2">
                  {!detail.editing ? (
                    <>
                      <Button onClick={()=> setDetail(s=> ({ ...s, editing: true }))}>Edit</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove the appointment.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex justify-end gap-2">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={deleteCurrent}>Delete</AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="secondary" onClick={openBackfillForDetail}>Backfill this hour</Button>
                      <Button variant="outline" onClick={downloadIcsForDetail}>Download .ics</Button>
                      <Button variant="ghost" onClick={()=> setDetail({ open: false })}>Close</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={saveDetailEdits}>Save</Button>
                      <Button variant="secondary" onClick={()=> setDetail(s=> ({ ...s, editing: false }))}>Cancel</Button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Backfill Now Dialog */}
        <Dialog open={backfill.open} onOpenChange={(open)=> setBackfill(s=>({ ...s, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite waitlist to this slot</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label>Slot Time</Label>
                <div className="text-sm opacity-80">{backfill.slot ? new Date(backfill.slot).toLocaleString() : 'No slot selected'}</div>
              </div>
              <div className="grid gap-1">
                <Label>Department</Label>
                <Select value={backfill.department} onValueChange={(val)=> setBackfill(s=> ({ ...s, department: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept)=> (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Doctor (optional)</Label>
                <Input list="doctor-suggestions" value={backfill.doctorName} onChange={(e)=> setBackfill(s=> ({ ...s, doctorName: e.target.value }))} />
              </div>
              {backfill.previewUrl && (
                <div className="text-xs break-all">Preview email: <a className="text-blue-600 underline" href={backfill.previewUrl} target="_blank" rel="noreferrer">{backfill.previewUrl}</a></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={()=> setBackfill(s=> ({ ...s, open: false }))}>Close</Button>
              <Button onClick={async ()=>{
                if (!backfill.slot) { toast({ title:'No slot selected', variant:'destructive'}); return; }
                try {
                  setBackfill(s=> ({ ...s, inviting: true }));
                  const token = localStorage.getItem('token')!;
                  const payload: any = { department: backfill.department, dateTime: backfill.slot.toISOString() };
                  if (backfill.doctorName) payload.doctorName = backfill.doctorName;
                  const res = await overbookAPI.inviteTopCandidate(token, payload);
                  toast({ title: 'Invite sent', description: 'Top waitlist candidate notified.' });
                  setBackfill(s=> ({ ...s, inviting: false, previewUrl: res?.previewUrl }));
                } catch (e: any) {
                  setBackfill(s=> ({ ...s, inviting: false }));
                  toast({ title: 'Invite failed', description: e?.message || 'Try again', variant: 'destructive' });
                }
              }} disabled={backfill.inviting || !backfill.slot}>{backfill.inviting ? 'Inviting…' : 'Send Invite'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={creating.open} onOpenChange={(open)=> setCreating(s=>({ ...s, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label htmlFor="doctor">Doctor Name</Label>
                <Input id="doctor" value={form.doctorName} onChange={(e)=> setForm(f=>({ ...f, doctorName: e.target.value }))}  />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="patient">Patient Name</Label>
                <Input id="patient" value={form.patientName} onChange={(e)=> setForm(f=>({ ...f, patientName: e.target.value }))}  />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="dept">Department</Label>
                <Select value={form.department} onValueChange={(val)=> setForm(f=> ({ ...f, department: val }))}>
                  <SelectTrigger id="dept">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept)=> (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={()=> setCreating({ open: false })}>Cancel</Button>
              <Button onClick={submitCreate} disabled={!form.doctorName || !form.patientName}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CalendarPage;
