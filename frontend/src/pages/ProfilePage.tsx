
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { ChevronLeft, Shield, ShieldCheck, User as UserIcon, Loader2, BadgeCheck, Trash2 } from "lucide-react";
import TwoFactorSetup from "../components/auth/TwoFactorSetup";
import { authAPI } from "../services/api";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [disable2FADialog, setDisable2FADialog] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [sessions, setSessions] = useState<Array<{ id: string; userAgent?: string; ip?: string; revoked?: boolean; createdAt?: string }>>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await authAPI.listSessions(token);
        setSessions(res || []);
      } catch {}
    };
    fetchSessions();
  }, []);

  const revoke = async (id: string) => {
    try {
      setRevokingId(id);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await authAPI.revokeSession(token, id);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, revoked: true } : s));
      toast({ title: 'Session revoked' });
    } catch (e: any) {
                <div className="text-xs text-gray-600">
                  Use at least 8 characters and mix upper/lowercase, numbers, and symbols.
                </div>
      toast({ title: 'Revoke failed', description: e.message || 'Could not revoke session', variant: 'destructive' });
    } finally {
      setRevokingId(null);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      toast({ title: "Invalid username", description: "Username cannot be empty", variant: "destructive" });
      return;
    }
    if (username === user?.username) {
      setEditing(false);
      return;
    }
    setSavingUsername(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      await authAPI.updateProfile(token, username.trim());
      updateUser({ username: username.trim() });
      toast({ title: "Username updated", description: "Changes saved successfully" });
      setEditing(false);
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || 'Could not update username', variant: 'destructive' });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNew.length < 6) {
      toast({ title: 'Password too short', description: 'Minimum 6 characters', variant: 'destructive' });
      return;
    }
    if (pwNew !== pwConfirm) {
      toast({ title: 'Passwords mismatch', description: 'Confirm password does not match', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await authAPI.changePassword(token, pwCurrent, pwNew);
      toast({ title: 'Password changed', description: 'Your password has been updated' });
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (e: any) {
      toast({ title: 'Change failed', description: e.message || 'Could not change password', variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await authAPI.uploadAvatar(token, avatarFile);
      updateUser({ avatarUrl: res.avatarUrl });
      toast({ title: 'Avatar updated' });
      setAvatarFile(null);
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message || 'Could not upload avatar', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const startEmailChange = async () => {
    if (!emailDraft) return;
    setEmailChangeLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await authAPI.startEmailChange(token, emailDraft);
      if (res.previewUrl) {
        setEmailPreviewUrl(res.previewUrl);
        toast({ title: 'Verification sent', description: 'Open the preview link to view the email.' });
      } else if (res.verificationToken) {
        setEmailToken(res.verificationToken);
        toast({ title: 'Email unavailable', description: 'Copy the token to verify manually.', variant: 'default' });
      } else {
        toast({ title: 'Verification sent', description: 'Please check your inbox for the verification email.' });
      }
    } catch (e: any) {
      toast({ title: 'Request failed', description: e.message || 'Could not start email change', variant: 'destructive' });
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const verifyEmailChange = async () => {
    if (!emailToken) return;
    setEmailChangeLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await authAPI.verifyEmailChange(token, emailToken);
      await refreshUser();
      toast({ title: 'Email updated', description: res.email });
      setEmailDraft(''); setEmailToken('');
    } catch (e: any) {
      toast({ title: 'Verification failed', description: e.message || 'Could not verify email', variant: 'destructive' });
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleDisable2FA = async (password: string, code: string) => {
    setIsDisabling2FA(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await authAPI.disable2FA(token, password, code);
      await refreshUser();
      toast({ title: '2FA Disabled', description: 'Two-factor authentication is now off' });
      setDisable2FADialog(false);
    } catch (e: any) {
      toast({ title: 'Disable failed', description: e.message || 'Could not disable 2FA', variant: 'destructive' });
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleTwoFactorComplete = async () => {
    setShowTwoFactorSetup(false);
    await refreshUser();
  };

  if (showTwoFactorSetup) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setShowTwoFactorSetup(false)}
        >
          <ChevronLeft className="mr-1" /> Back
        </Button>
        
        <div className="max-w-md mx-auto">
          <TwoFactorSetup
            onComplete={handleTwoFactorComplete}
            onCancel={() => setShowTwoFactorSetup(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="mr-1" /> Back to Home
      </Button>

      <div className="max-w-2xl mx-auto space-y-6">
  <h1 className="text-3xl font-bold">Profile Settings</h1>

        {/* User / Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            {user?.avatarUrl ? (
              <div className="relative group">
                <img src={(user.avatarUrl.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`)} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove avatar"
                  className="hidden group-hover:flex absolute -right-2 -bottom-2 h-8 w-8 rounded-full bg-red-600 text-white items-center justify-center shadow"
                  onClick={async ()=>{
                    try {
                      const token = localStorage.getItem('token');
                      if (!token) throw new Error('Not authenticated');
                      await authAPI.deleteAvatar(token);
                      updateUser({ avatarUrl: null });
                      toast({ title: 'Avatar removed' });
                    } catch(e:any){
                      toast({ title: 'Delete failed', description: e?.message || 'Could not remove avatar', variant: 'destructive' });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold select-none">
                {user?.username?.[0]?.toUpperCase() || <UserIcon className="h-6 w-6" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input value={username} onChange={e => setUsername(e.target.value)} className="h-8" autoFocus />
                    <Button size="sm" onClick={handleSaveUsername} disabled={savingUsername}>
                      {savingUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(false); setUsername(user?.username || ''); }}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <span className="truncate">{user?.username}</span>
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                  </>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-muted capitalize flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3" /> {user?.role?.toLowerCase()}
                </span>
                <span className="text-xs text-muted-foreground break-all">{user?.email}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Update your public display name. Email is used for login and can be changed with verification.</p>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={e=> setAvatarFile(e.target.files?.[0] || null)} />
              <Button onClick={handleAvatarUpload} disabled={!avatarFile || uploadingAvatar}>
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Avatar'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="newEmail">New Email</Label>
                <Input id="newEmail" type="email" value={emailDraft} onChange={e=>setEmailDraft(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button onClick={startEmailChange} disabled={!emailDraft || emailChangeLoading}>Start Change</Button>
              <div className="space-y-1">
                <Label htmlFor="emailToken">Verification Token</Label>
                <Input id="emailToken" value={emailToken} onChange={e=>setEmailToken(e.target.value)} placeholder="Paste code" />
              </div>
              <Button onClick={verifyEmailChange} disabled={!emailToken || emailChangeLoading}>Verify</Button>
            </div>
            {emailPreviewUrl && (
              <div className="text-xs text-muted-foreground">
                Dev preview: <a className="underline" href={emailPreviewUrl} target="_blank" rel="noreferrer">Open verification email</a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle>
            <CardDescription>Password management & two-factor authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={pwCurrent} onChange={e=>setPwCurrent(e.target.value)} required autoComplete="current-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} required autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} required autoComplete="new-password" />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
                </Button>
                <span className="text-xs text-muted-foreground">Minimum 6 characters.</span>
                {pwNew && (
                  <span className={`text-xs ${pwNew.length>=10?'text-green-600':pwNew.length>=8?'text-yellow-600':'text-red-600'}`}>
                    Strength: {pwNew.length>=10?'strong':pwNew.length>=8?'medium':'weak'}
                  </span>
                )}
              </div>
            </form>
            <Separator />
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {user?.twoFactorEnabled ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <Shield className="h-5 w-5 text-gray-400" />}
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    {user?.twoFactorEnabled ? 'Account protected with 2FA' : 'Add an extra security layer'}
                  </div>
                </div>
              </div>
              {user?.twoFactorEnabled ? (
                <Button variant="outline" onClick={()=>setDisable2FADialog(true)} disabled={isDisabling2FA}>
                  {isDisabling2FA ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable'}
                </Button>
              ) : (
                <Button onClick={()=>setShowTwoFactorSetup(true)}>Enable 2FA</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage signed-in devices and sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-end">
              <RevokeOthersButton />
            </div>
            {sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sessions found.</div>
            ) : (
              <ul className="divide-y border rounded">
                {sessions.map((s) => (
                  <li key={s.id} className="p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.userAgent || 'Unknown device'}</div>
                      <div className="text-xs text-muted-foreground">{s.ip || 'ip n/a'} • {s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.revoked ? (
                        <span className="text-xs text-red-600">revoked</span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => revoke(s.id)} disabled={revokingId === s.id}>
                          {revokingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revoke'}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="destructive" onClick={logout}>Logout</Button>
          </CardContent>
        </Card>
      </div>
      <Disable2FADialog open={disable2FADialog} onOpenChange={setDisable2FADialog} onConfirm={handleDisable2FA} loading={isDisabling2FA} />
    </div>
  );
};

export default ProfilePage;

// Disable 2FA Dialog Component
const Disable2FADialog: React.FC<{ open: boolean; onOpenChange: (v:boolean)=>void; onConfirm:(password:string,code:string)=>void; loading:boolean; }> = ({ open, onOpenChange, onConfirm, loading }) => {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const submit = () => {
    if (!password || !code) return;
    onConfirm(password, code);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
          <DialogDescription>Enter your password and current 2FA code to disable two-factor authentication.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="disablePassword">Password</Label>
            <Input id="disablePassword" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disableCode">2FA Code</Label>
            <Input id="disableCode" value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !password || !code} variant="destructive">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable 2FA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RevokeOthersButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const handle = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      await authAPI.revokeOtherSessions(token);
      toast({ title: 'Done', description: 'Other sessions revoked' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Could not revoke sessions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revoke other sessions'}
    </Button>
  );
};
