import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { getAccessToken, initAuth, googleSignIn } from '../../lib/googleAuth';
import { Calendar as CalendarIcon, Mail, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

export function MyDayEmailWidgets() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);

  useEffect(() => {
    initAuth(
      (user, t) => {
        setToken(t);
        setNeedsAuth(false);
      },
      () => setNeedsAuth(true)
    );
  }, []);

  useEffect(() => {
    if (token) {
      fetchEvents(token);
      fetchEmails(token);
    }
  }, [token]);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const fetchEvents = async (accessToken: string) => {
    setLoadingEvents(true);
    try {
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date();
      timeMax.setHours(23, 59, 59, 999);

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&orderBy=startTime&singleEvents=true&maxResults=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEmails = async (accessToken: string) => {
    setLoadingEmails(true);
    try {
      // Fetch recent unread emails
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=4`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const messages = data.messages || [];
        
        const detailedMessages: GmailMessage[] = [];
        for (const msg of messages) {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const headers = detailData.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
            const fromHeader = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
            const date = headers.find((h: any) => h.name === 'Date')?.value || '';
            
            // Clean up 'From' header
            let from = fromHeader;
            const emailMatch = fromHeader.match(/(.*)<.*>/);
            if (emailMatch && emailMatch[1]) {
              from = emailMatch[1].replace(/"/g, '').trim();
            }

            detailedMessages.push({
              id: detailData.id,
              threadId: detailData.threadId,
              snippet: detailData.snippet,
              subject,
              from,
              date
            });
          }
        }
        setEmails(detailedMessages);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) return 'All Day';
    if (!event.start.dateTime) return '';
    return format(parseISO(event.start.dateTime), 'h:mm a');
  };

  const getEventColor = (index: number) => {
    const colors = ['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400'];
    return colors[index % colors.length];
  };

  return (
    <div className="flex gap-4 shrink-0 h-[140px]">
      {/* My Day Widget */}
      <div className="flex-1 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col min-w-0 min-h-[140px] max-h-[350px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">My Day</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1">Today</span>
          </div>
          <button onClick={() => token ? fetchEvents(token) : handleLogin()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5", loadingEvents && "animate-spin")} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {needsAuth ? (
             <div className="text-sm text-slate-500 flex flex-col items-center justify-center py-4 h-full">
                <button onClick={handleLogin} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors rounded-lg text-xs font-bold">Connect Calendar</button>
             </div>
          ) : events.length === 0 && !loadingEvents ? (
            <div className="text-sm text-slate-500 flex items-center justify-center py-6 h-full">No upcoming events today.</div>
          ) : (
            events.map((event, i) => (
              <div key={event.id} className="flex gap-3 group">
                <div className="w-14 text-right text-[11px] font-semibold text-slate-400 pt-0.5">
                  {formatEventTime(event)}
                </div>
                <div className={cn("w-1 rounded-full", getEventColor(i))} />
                <div className="flex-1">
                  <a href={event.htmlLink} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                    {event.summary || 'Busy'}
                  </a>
                  <div className="text-[11px] text-slate-500 mt-0.5">Google Calendar</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Widget */}
      <div className="flex-[1.5] bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col min-w-0 min-h-[140px] max-h-[350px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center text-red-600">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Email</h2>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-1">{emails.length} new</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => token ? fetchEmails(token) : handleLogin()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              <RefreshCw className={cn("w-3.5 h-3.5", loadingEmails && "animate-spin")} />
            </button>
            <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              View all <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {needsAuth ? (
             <div className="text-sm text-slate-500 flex flex-col items-center justify-center py-4 h-full">
                <button onClick={handleLogin} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors rounded-lg text-xs font-bold">Connect Gmail</button>
             </div>
          ) : emails.length === 0 && !loadingEmails ? (
            <div className="text-sm text-slate-500 flex items-center justify-center py-6 h-full">Inbox zero! No unread emails.</div>
          ) : (
            emails.map((email) => {
              const initials = email.from.substring(0, 2).toUpperCase();
              return (
                <div key={email.id} className="flex gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-sm font-bold text-slate-900 truncate pr-2">{email.from}</div>
                      <div className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {email.date ? format(new Date(email.date), 'h:mm a') : ''}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate mb-0.5">{email.subject}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1" dangerouslySetInnerHTML={{ __html: email.snippet }} />
                  </div>
                  <div className="shrink-0 flex items-center">
                    <button className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add task
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
