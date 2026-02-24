import React, { useState } from 'react'
import {
    Users, UserPlus, Heart, HandHelping, Banknote, Landmark,
    Calendar, LayoutDashboard, ScrollText, Settings, Bell,
    Search, ChevronRight, Menu, X, CheckCircle2, Flame,
    BookOpen, PlusCircle, ExternalLink, Filter, Save, Edit2,
    Moon, Sun, Camera, LogOut, Trash2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

const LineGraph = ({ data, color = '#3b82f6', isDarkMode }) => {
    if (!data || data.length < 2) return (
        <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs font-medium">
            Not enough data for trends
        </div>
    )

    const max = Math.max(...data.map(d => d.value)) * 1.2 || 10
    const min = Math.min(...data.map(d => d.value)) * 0.8 || 0
    const range = max - min
    const width = 400
    const height = 100
    const padding = 10

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((d.value - min) / range) * (height - padding * 2) - padding
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="w-full h-full relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                    </linearGradient>
                </defs>
                <path
                    d={`M ${points}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-lg"
                />
                <path
                    d={`M 0,${height} L ${points} L ${width},${height} Z`}
                    fill={`url(#grad-${color})`}
                />
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={(i / (data.length - 1)) * width}
                        cy={height - ((d.value - min) / range) * (height - padding * 2) - padding}
                        r="3"
                        fill={isDarkMode ? '#0f172a' : '#fff'}
                        stroke={color}
                        strokeWidth="2"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                ))}
            </svg>
        </div>
    )
}

function Dashboard({ isDarkMode, toggleDarkMode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [topics, setTopics] = useState([])
    const [newTopic, setNewTopic] = useState('')
    const [newSpeaker, setNewSpeaker] = useState('')
    const [newDate, setNewDate] = useState('')
    const [loading, setLoading] = useState(true)
    const [editingMetric, setEditingMetric] = useState(null)
    const [metricValue, setMetricValue] = useState('')

    const [metricData, setMetricData] = useState({
        attendance_adults: '0',
        attendance_kids: '0',
        tithes: '$0',
        offerings: '$0',
        visitors: '0',
        volunteers: '0',
        salvations: '0',
        baptisms: '0'
    })

    const [events, setEvents] = useState([])
    const [members, setMembers] = useState([])
    const [activeView, setActiveView] = useState('overview')
    const [profilePic, setProfilePic] = useState(null)
    const [historicalMetrics, setHistoricalMetrics] = useState({})
    const [isAddingRoster, setIsAddingRoster] = useState(false)
    const [isAddingEvent, setIsAddingEvent] = useState(false)
    const [isAddingMember, setIsAddingMember] = useState(false)
    const [editingRoster, setEditingRoster] = useState(null)
    const [editingEvent, setEditingEvent] = useState(null)
    const [metricDate, setMetricDate] = useState(new Date().toISOString().split('T')[0])
    const [lastWeekMetrics, setLastWeekMetrics] = useState({})
    const [selectedMetric, setSelectedMetric] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: metrics, error: mError } = await supabase
                .from('metrics')
                .select('*')
                .order('metric_date', { ascending: false })

            if (mError) throw mError

            // Group metrics by type (latest only for display)
            const latestMetrics = {}
            metrics.forEach(m => {
                if (!latestMetrics[m.metric_type]) {
                    latestMetrics[m.metric_type] = m.metric_value
                }
            })

            setMetricData(prev => ({
                ...prev,
                ...latestMetrics
            }))

            // Fetch metrics from ~7 days ago for comparison
            const lastWeekDate = new Date()
            lastWeekDate.setDate(lastWeekDate.getDate() - 7)
            const lastWeekIso = lastWeekDate.toISOString().split('T')[0]

            const { data: pastMetrics, error: pError } = await supabase
                .from('metrics')
                .select('*')
                .eq('metric_date', lastWeekIso)

            if (!pError && pastMetrics) {
                const pastMetricsMap = {}
                pastMetrics.forEach(m => {
                    pastMetricsMap[m.metric_type] = m.metric_value
                })
                setLastWeekMetrics(pastMetricsMap)
            }

            const { data: roster, error: rError } = await supabase
                .from('preaching_roster')
                .select('*')
                .order('date', { ascending: true })

            if (rError) throw rError
            setTopics(roster || [])

            const { data: eventData, error: eError } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true })
                .limit(5)

            if (eError) throw eError
            setEvents(eventData || [])

            if (memberError) throw memberError
            setMembers(memberData || [])

            // Fetch historical metrics for the graph (last 30 days)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const thirtyDaysIso = thirtyDaysAgo.toISOString().split('T')[0]

            const { data: history, error: hError } = await supabase
                .from('metrics')
                .select('*')
                .gte('metric_date', thirtyDaysIso)
                .order('metric_date', { ascending: true })

            if (!hError && history) {
                const grouped = {}
                history.forEach(m => {
                    if (!grouped[m.metric_type]) grouped[m.metric_type] = []
                    grouped[m.metric_type].push({
                        date: m.metric_date,
                        value: m.metric_value
                    })
                })
                setHistoricalMetrics(grouped)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const addTopic = async (e) => {
        e.preventDefault()
        if (!newTopic || !newSpeaker || !newDate) return

        try {
            const { error } = await supabase
                .from('preaching_roster')
                .insert([{
                    topic: newTopic,
                    speaker: newSpeaker,
                    date: newDate,
                    status: 'confirmed'
                }])

            if (error) throw error
            setNewTopic('')
            setNewSpeaker('')
            setNewDate('')
            fetchData()
        } catch (error) {
            alert('Error adding topic: ' + error.message)
        }
    }

    const updateMetric = async () => {
        if (!editingMetric || !metricValue) return

        try {
            const { error } = await supabase
                .from('metrics')
                .insert([{
                    metric_type: editingMetric,
                    metric_value: parseFloat(metricValue.replace(/[^0-9.]/g, '')),
                    metric_date: metricDate
                }])

            if (error) throw error
            setEditingMetric(null)
            setMetricDate(new Date().toISOString().split('T')[0])
            fetchData()
        } catch (error) {
            alert('Error updating metric: ' + error.message)
        }
    }

    const addEvent = async (e) => {
        e.preventDefault()
        const title = e.target.title.value
        const date = e.target.date.value
        const time = e.target.time.value
        const desc = e.target.description.value

        try {
            const { error } = await supabase
                .from('events')
                .insert([{ title, event_date: date, event_time: time, description: desc, status: 'upcoming' }])
            if (error) throw error
            setIsAddingEvent(false)
            fetchData()
        } catch (err) { alert('Error adding event: ' + err.message) }
    }

    const addMember = async (e) => {
        e.preventDefault()
        const name = e.target.name.value
        const email = e.target.email.value
        const status = e.target.status.value

        try {
            const { error } = await supabase
                .from('members')
                .insert([{ full_name: name, email, member_status: status }])
            if (error) throw error
            setIsAddingMember(false)
            fetchData()
        } catch (err) { alert('Error adding member: ' + err.message) }
    }

    const updateRosterStatus = async (id, status) => {
        try {
            const { error } = await supabase
                .from('preaching_roster')
                .update({ status })
                .eq('id', id)
            if (error) throw error
            fetchData()
        } catch (err) { alert('Error updating roster: ' + err.message) }
    }

    const deleteRosterEntry = async (id) => {
        if (!confirm('Are you sure you want to delete this roster entry?')) return
        try {
            const { error } = await supabase.from('preaching_roster').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (err) { alert('Error deleting roster: ' + err.message) }
    }

    const deleteEvent = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return
        try {
            const { error } = await supabase.from('events').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (err) { alert('Error deleting event: ' + err.message) }
    }

    const updateEvent = async (e) => {
        e.preventDefault()
        if (!editingEvent) return
        const title = e.target.title.value
        const date = e.target.date.value
        const time = e.target.time.value
        const desc = e.target.description.value

        try {
            const { error } = await supabase
                .from('events')
                .update({ title, event_date: date, event_time: time, description: desc })
                .eq('id', editingEvent.id)
            if (error) throw error
            setEditingEvent(null)
            fetchData()
        } catch (err) { alert('Error updating event: ' + err.message) }
    }

    const kpis = [
        { id: 'attendance_adults', label: 'Adult Attendance', value: metricData.attendance_adults, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', lineColor: '#3b82f6' },
        { id: 'attendance_kids', label: 'Kids Attendance', value: metricData.attendance_kids, icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10', lineColor: '#10b981' },
        { id: 'tithes', label: "Tithes", value: `$${parseFloat(metricData.tithes || 0).toLocaleString()}`, icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-500/10', lineColor: '#f59e0b' },
        { id: 'offerings', label: "Offerings", value: `$${parseFloat(metricData.offerings || 0).toLocaleString()}`, icon: Landmark, color: 'text-purple-400', bg: 'bg-purple-500/10', lineColor: '#8b5cf6' },
        { id: 'visitors', label: 'New Visitors', value: metricData.visitors, icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10', lineColor: '#f43f5e' },
        { id: 'volunteers', label: 'Volunteers', value: metricData.volunteers, icon: HandHelping, color: 'text-indigo-400', bg: 'bg-indigo-500/10', lineColor: '#6366f1' },
    ]

    const milestones = [
        { id: 'salvations', label: 'Salvations', value: metricData.salvations, icon: Flame, color: 'text-orange-400', sub: 'This Month' },
        { id: 'baptisms', label: 'Baptisms', value: metricData.baptisms, icon: CheckCircle2, color: 'text-sky-400', sub: 'Next Sunday' },
    ]

    const handleProfileUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePic(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex font-sans overflow-hidden transition-colors duration-500`}>

            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 border-r ${isDarkMode ? 'border-white/5 bg-slate-900/40' : 'border-slate-200 bg-white'} backdrop-blur-xl flex flex-col z-50`}
            >
                <div className="p-6 flex items-center justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                                <div className="w-4 h-4 rounded-full border-2 border-emerald-400/60" />
                            </div>
                            <span className="font-bold tracking-tight text-xl uppercase">The Rock</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={LayoutDashboard} label="Overview" active={activeView === 'overview'} onClick={() => setActiveView('overview')} expanded={sidebarOpen} />
                    <NavItem icon={Calendar} label="Events" active={activeView === 'events'} onClick={() => setActiveView('events')} expanded={sidebarOpen} />
                    <NavItem icon={ScrollText} label="Preaching Roster" active={activeView === 'roster'} onClick={() => setActiveView('roster')} expanded={sidebarOpen} />
                    <NavItem icon={Users} label="People" active={activeView === 'people'} onClick={() => setActiveView('people')} expanded={sidebarOpen} />
                </nav>

                {sidebarOpen && (
                    <div className="p-6">
                        <div className="glass-card p-4 rounded-2xl border border-white/10">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Upcoming Events</h3>
                            <div className="space-y-4">
                                {events.length > 0 ? (
                                    events.map(event => (
                                        <EventItem key={event.id} title={event.title} date={new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })} />
                                    ))
                                ) : (
                                    <>
                                        <EventItem title="Gala Night" date="Feb 24" />
                                        <EventItem title="Youth Retreat" date="Mar 02" />
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => alert('Google Calendar Sync feature is under development. Please configure Client ID and API Key.')}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 p-2"
                            >
                                <Calendar size={12} /> SYNC GOOGLE CALENDAR
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">

                {/* Header */}
                <header className={`h-20 border-b ${isDarkMode ? 'border-white/5 bg-slate-950/40' : 'border-slate-200 bg-white/80'} flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-40`}>
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative w-full group">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-blue-400 transition-colors`} size={18} />
                            <input
                                type="text"
                                placeholder="Search dashboard..."
                                className={`w-full ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} border rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/30 transition-all text-sm`}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-blue-400 hover:bg-white/10' : 'bg-slate-100 text-amber-600 hover:bg-slate-200'}`}
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold">Admin User</p>
                            <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Administration</p>
                        </div>
                        <label className="relative w-10 h-10 rounded-full cursor-pointer group overflow-hidden">
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} />
                            {profilePic ? (
                                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/10" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={16} className="text-white" />
                            </div>
                        </label>
                    </div>
                </header>

                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {activeView === 'overview' && (
                        <>
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Ministry Overview</h2>
                                    <p className="text-slate-500 text-sm mt-1">Real-time engagement and logistics monitoring.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {kpis.map((m, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedMetric(selectedMetric === m.id ? null : m.id)}
                                        className={`${isDarkMode ? 'glass-card border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-200 hover:bg-slate-50'} p-6 rounded-3xl border transition-all duration-500 hover:translate-y--1 relative shadow-xl group flex flex-col h-full cursor-pointer ${selectedMetric === m.id ? 'ring-2 ring-blue-500' : ''}`}
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingMetric(m.id); setMetricValue(m.value.toString().replace(/[^0-9.]/g, '')); }}
                                            className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5 rounded-lg text-blue-400 z-20"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${m.bg} ${m.color} group-hover:scale-110 transition-transform duration-500`}>
                                                <m.icon size={24} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium mb-1`}>{m.label}</h4>
                                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>{m.value}</p>
                                        </div>
                                        <div className="h-16 mt-6 overflow-hidden pointer-events-none">
                                            <LineGraph data={historicalMetrics[m.id] || []} color={m.lineColor} isDarkMode={isDarkMode} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedMetric && (
                                <div className={`${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200'} p-8 rounded-3xl border animate-in slide-in-from-top-4 duration-500`}>
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold">Historical Trend: {kpis.find(k => k.id === selectedMetric)?.label}</h3>
                                            <p className="text-slate-500 text-sm">Monitoring changes over the last 30 days.</p>
                                        </div>
                                        <button onClick={() => setSelectedMetric(null)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
                                    </div>
                                    <div className="h-64">
                                        <LineGraph
                                            data={historicalMetrics[selectedMetric] || []}
                                            color={kpis.find(k => k.id === selectedMetric)?.lineColor}
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                    <div className="grid grid-cols-7 mt-6 gap-2">
                                        {(historicalMetrics[selectedMetric] || []).slice(-7).map((d, i) => (
                                            <div key={i} className="text-center">
                                                <p className="text-[10px] font-bold uppercase text-slate-500">{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                                                <p className="text-sm font-bold mt-1">{d.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="space-y-6">
                                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-widest pl-2`}>Spiritual Milestones</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {milestones.map((ms, i) => (
                                            <div key={i} className={`${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200'} p-6 rounded-3xl border relative overflow-hidden group shadow-lg`}>
                                                <button
                                                    onClick={() => { setEditingMetric(ms.id); setMetricValue(ms.value.toString()); }}
                                                    className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5 rounded-lg text-blue-400 z-10"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                                    <ms.icon size={120} />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-4 rounded-full ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-slate-50 border-slate-200'} border ${ms.color}`}>
                                                        <ms.icon size={24} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{ms.value}</p>
                                                        <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{ms.label} • {ms.sub}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200'} p-6 rounded-3xl border mt-8 shadow-lg`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Sermon Planning</h3>
                                            <BookOpen size={16} className="text-blue-400" />
                                        </div>
                                        <form onSubmit={addTopic} className="space-y-4">
                                            <input type="text" required value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Sermon Topic" className={`w-full ${isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200'} border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/30 transition-all outline-none`} />
                                            <input type="text" required value={newSpeaker} onChange={(e) => setNewSpeaker(e.target.value)} placeholder="Speaker Name" className={`w-full ${isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200'} border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/30 transition-all outline-none`} />
                                            <input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} className={`w-full ${isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200'} border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/30 transition-all outline-none ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`} />
                                            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 text-white">Add to Roster</button>
                                        </form>
                                    </div>
                                </div>

                                <div className="lg:col-span-2">
                                    <div className={`${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200'} rounded-3xl border overflow-hidden h-full shadow-lg`}>
                                        <div className={`p-8 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'} flex items-center justify-between`}>
                                            <div>
                                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Latest Roster</h3>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Coordinate service speakers and topics.</p>
                                            </div>
                                            <button onClick={() => setActiveView('roster')} className="text-blue-400 p-2 hover:bg-blue-400/10 rounded-lg transition-colors">
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                                        <th className="pb-4 pl-4">Date</th>
                                                        <th className="pb-4">Topic</th>
                                                        <th className="pb-4">Speaker</th>
                                                        <th className="pb-4">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {topics.slice(0, 5).map((t) => (
                                                        <tr key={t.id} className={`group hover:${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} transition-colors`}>
                                                            <td className={`py-5 pl-4 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.date}</td>
                                                            <td className="py-5"><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} group-hover:text-blue-400 transition-colors`}>{t.topic}</span></td>
                                                            <td className={`py-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.speaker}</td>
                                                            <td className="py-5">
                                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                    {t.status || 'SCHEDULED'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeView === 'events' && (
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Events Management</h2>
                                    <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-sm mt-1`}>Plan and coordinate church events.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddingEvent(true)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <PlusCircle size={20} /> Create Event
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map(event => (
                                    <div key={event.id} className={`${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200'} p-8 rounded-[2.5rem] border hover:border-blue-500/30 transition-all shadow-xl group cursor-pointer`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 rounded-2xl bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Calendar size={24} />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}
                                                    className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                                                    className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className={`font-bold text-xl mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'} transition-colors`}>{event.title}</h4>
                                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mb-6 line-clamp-2 leading-relaxed`}>{event.description}</p>
                                        <div className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-xs font-medium`}>
                                            <Calendar size={16} />
                                            <span>{new Date(event.event_date).toLocaleDateString()} at {event.event_time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeView === 'roster' && (
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Preaching Roster</h2>
                                    <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-sm mt-1`}>Full schedule of preachers and topics.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddingRoster(!isAddingRoster)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <PlusCircle size={20} /> {isAddingRoster ? 'Close Form' : 'Add Entry'}
                                </button>
                            </div>

                            {isAddingRoster && (
                                <form onSubmit={addTopic} className={`${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} border rounded-[2.5rem] p-10 mb-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl`}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <label className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sermon Topic</label>
                                            <input
                                                type="text"
                                                required
                                                value={newTopic}
                                                onChange={(e) => setNewTopic(e.target.value)}
                                                placeholder="Enter topic..."
                                                className={`w-full ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-200'} border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium`}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Speaker</label>
                                            <input
                                                type="text"
                                                required
                                                value={newSpeaker}
                                                onChange={(e) => setNewSpeaker(e.target.value)}
                                                placeholder="Enter speaker name..."
                                                className={`w-full ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-200'} border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium`}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Service Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={newDate}
                                                onChange={(e) => setNewDate(e.target.value)}
                                                className={`w-full ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-200'} border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95">
                                            <Save size={20} />
                                            Save Schedule
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className={`${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200'} rounded-[2.5rem] border overflow-hidden shadow-2xl`}>
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                                <th className="py-6 pl-8">Date</th>
                                                <th className="py-6 px-6">Topic / Theme</th>
                                                <th className="py-6 px-6">Speaker</th>
                                                <th className="py-6 px-6">Status</th>
                                                <th className="py-6 pr-8 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {topics.map((t) => (
                                                <tr key={t.id} className={`group hover:${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} transition-all`}>
                                                    <td className={`py-6 pl-8 font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t.date}</td>
                                                    <td className="py-6 px-6"><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} group-hover:text-blue-500 transition-colors text-base tracking-tight`}>{t.topic}</span></td>
                                                    <td className="py-6 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                                                                {t.speaker.charAt(0)}
                                                            </div>
                                                            <span className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{t.speaker}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6">
                                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${t.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                            {t.status || 'SCHEDULED'}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 pr-8 text-right flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingRoster(t)}
                                                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteRosterEntry(t.id)}
                                                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-500 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-400 hover:text-rose-600'}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'people' && (
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Congregation Management</h2>
                                    <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-sm mt-1`}>Manage the church congregation.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddingMember(true)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl text-white font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <UserPlus size={20} /> Add Member
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {members.map(member => (
                                    <div key={member.id} className={`${isDarkMode ? 'glass-card border-white/5' : 'bg-white border-slate-200'} p-8 rounded-[2.5rem] border hover:border-blue-500/30 transition-all shadow-xl group cursor-pointer flex flex-col items-center text-center`}>
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-blue-500/20 mb-6 group-hover:scale-110 transition-transform">
                                            {member.full_name.charAt(0)}
                                        </div>
                                        <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'} transition-colors mb-1`}>{member.full_name}</h4>
                                        <p className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-xs font-medium mb-6`}>{member.email}</p>
                                        <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${member.member_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                {member.member_status}
                                            </span>
                                            <button className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-900'}`}>
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Edit Metric Modal */}
            {editingMetric && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-slate-100">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-200/60'} backdrop-blur-sm`} onClick={() => setEditingMetric(null)} />
                    <div className={`relative w-full max-w-md ${isDarkMode ? 'glass-card border-white/10' : 'bg-white border-slate-200 shadow-2xl'} p-8 rounded-3xl border animate-in zoom-in-95 duration-300`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-xl font-bold uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Update {editingMetric.replace('_', ' ')}</h3>
                            <button onClick={() => setEditingMetric(null)} className={`p-2 ${isDarkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} rounded-full`}><X size={20} /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Value</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={metricValue}
                                        onChange={(e) => setMetricValue(e.target.value)}
                                        className={`w-full ${isDarkMode ? 'bg-slate-900/60 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 text-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-sans`}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                    <input
                                        type="date"
                                        value={metricDate}
                                        onChange={(e) => setMetricDate(e.target.value)}
                                        className={`w-full ${isDarkMode ? 'bg-slate-900/60 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-5 px-6 text-base font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all font-sans`}
                                    />
                                </div>
                            </div>

                            {lastWeekMetrics[editingMetric] && (
                                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">Last week (same day):</span>
                                    <span className="text-sm font-bold text-blue-400">{lastWeekMetrics[editingMetric]}</span>
                                </div>
                            )}

                            <button
                                onClick={updateMetric}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Save size={18} /> SAVE CHANGES
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Event Modal */}
            {isAddingEvent && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-slate-100">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-200/60'} backdrop-blur-sm`} onClick={() => setIsAddingEvent(false)} />
                    <form onSubmit={addEvent} className={`relative w-full max-w-lg ${isDarkMode ? 'glass-card border-white/10 text-white' : 'bg-white border-slate-200 shadow-2xl text-slate-900'} p-10 rounded-[2.5rem] border animate-in zoom-in-95 duration-300`}>
                        <h3 className="text-2xl font-bold mb-8">Create Church Event</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Event Title</label>
                                <input name="title" required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500/50`} placeholder="e.g. Youth Prayer Meeting" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
                                    <input name="date" type="date" required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none`} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Time</label>
                                    <input name="time" type="time" required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none`} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
                                <textarea name="description" rows="3" className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none resize-none`} placeholder="Briefly describe the event..." />
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl transition-all">CREATE EVENT</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Event Modal */}
            {editingEvent && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-slate-100">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-200/60'} backdrop-blur-sm`} onClick={() => setEditingEvent(null)} />
                    <form onSubmit={updateEvent} className={`relative w-full max-w-lg ${isDarkMode ? 'glass-card border-white/10 text-white' : 'bg-white border-slate-200 shadow-2xl text-slate-900'} p-10 rounded-[2.5rem] border animate-in zoom-in-95 duration-300`}>
                        <h3 className="text-2xl font-bold mb-8">Edit Church Event</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Event Title</label>
                                <input name="title" defaultValue={editingEvent.title} required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-500/50`} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
                                    <input name="date" type="date" defaultValue={editingEvent.event_date} required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none`} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Time</label>
                                    <input name="time" type="time" defaultValue={editingEvent.event_time} required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none`} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
                                <textarea name="description" defaultValue={editingEvent.description} rows="3" className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none resize-none`} />
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl transition-all uppercase tracking-widest">Update Event</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Add Member Modal */}
            {isAddingMember && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-slate-100">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-200/60'} backdrop-blur-sm`} onClick={() => setIsAddingMember(false)} />
                    <form onSubmit={addMember} className={`relative w-full max-w-md ${isDarkMode ? 'glass-card border-white/10 text-white' : 'bg-white border-slate-200 shadow-2xl text-slate-900'} p-10 rounded-[2.5rem] border animate-in zoom-in-95 duration-300`}>
                        <h3 className="text-2xl font-bold mb-8">Add New Member</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                                <input name="name" required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none`} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                                <input name="email" type="email" required className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none`} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Status</label>
                                <select name="status" className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl py-4 px-6 outline-none appearance-none`}>
                                    <option value="active" className="bg-slate-900">Active</option>
                                    <option value="inactive" className="bg-slate-900">Inactive</option>
                                    <option value="visitor" className="bg-slate-900">Visitor</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl transition-all">REGISTER MEMBER</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Roster Modal */}
            {editingRoster && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-slate-100">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-200/60'} backdrop-blur-sm`} onClick={() => setEditingRoster(null)} />
                    <div className={`relative w-full max-w-md ${isDarkMode ? 'glass-card border-white/10 text-white' : 'bg-white border-slate-200 shadow-2xl text-slate-900'} p-10 rounded-[2.5rem] border animate-in zoom-in-95 duration-300`}>
                        <h3 className="text-2xl font-bold mb-8">Update Status</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {['scheduled', 'confirmed', 'completed', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => { updateRosterStatus(editingRoster.id, status); setEditingRoster(null); }}
                                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${editingRoster.status === status ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}

// Sub-components for cleaner structure
function NavItem({ icon: Icon, label, active = false, expanded = true, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
        >
            <Icon size={20} />
            {expanded && <span className="text-sm font-bold tracking-tight">{label}</span>}
        </button>
    )
}

function EventItem({ title, date }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{title}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-600 tracking-tighter">{date}</span>
        </div>
    )
}

export default Dashboard
