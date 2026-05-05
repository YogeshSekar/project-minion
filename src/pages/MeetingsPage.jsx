import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, Briefcase, Video, Edit3, Save, X, Plus, List, LayoutGrid, Filter, ArrowUpDown, MoreVertical, Star, Paperclip, Loader2, Check } from 'lucide-react'
import useProjects from '../hooks/useProjects'
import useClickOutside from '../hooks/useClickOutside'

// Date navigator helper functions
const getWeekDays = (selectedDate) => {
  const days = []
  const startOfWeek = new Date(selectedDate)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    days.push(day)
  }
  return days
}

const formatDateLabel = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function MeetingsPage() {
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [meetingNotes, setMeetingNotes] = useState({})
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [currentNotes, setCurrentNotes] = useState('')
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [filterOption, setFilterOption] = useState('all')
  const [sortOption, setSortOption] = useState('start_time')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [meetingProjects, setMeetingProjects] = useState({})
  const [activeTab, setActiveTab] = useState('notes')
  const [meetingUrls, setMeetingUrls] = useState({})
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [editedUrl, setEditedUrl] = useState('')

  // Use hooks for data management
  const { projects, loading: projectsLoading } = useProjects()
  
  // Use click-outside hooks for dropdowns
  const filterDropdown = useClickOutside()
  const sortDropdown = useClickOutside()
  const calendarDropdown = useClickOutside()
  const projectDropdown = useClickOutside()

  // Date navigator functions
  const weekDays = getWeekDays(selectedDate)
  
  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() || 7 // Convert Sunday (0) to 7
    
    const days = []
    // Add empty cells for days before month starts
    for (let i = 1; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const handleCalendarClick = (date) => {
    setSelectedDate(date)
    calendarDropdown.setIsOpen(false)
  }

  const handleCalendarToggle = () => {
    if (!calendarDropdown.isOpen) {
      // Sync calendar to selected date when opening
      setCalendarMonth(new Date(selectedDate))
    }
    calendarDropdown.setIsOpen(!calendarDropdown.isOpen)
  }

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
  }

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Load meetings from Outlook when selected date changes
  useEffect(() => {
    loadMeetingsForDateRange()
  }, [selectedDate])

  useEffect(() => {
    if (selectedMeeting) {
      setCurrentNotes(meetingNotes[selectedMeeting.id] || '')
    }
  }, [selectedMeeting, meetingNotes])

  const handleProjectSelect = async (projectId) => {
    console.log('[handleProjectSelect] Called with projectId:', projectId, 'selectedMeeting:', selectedMeeting?.externalId);
    
    if (!selectedMeeting) {
      console.warn('[handleProjectSelect] No meeting selected, cannot assign project');
      projectDropdown.setIsOpen(false);
      return;
    }
    
    const externalId = selectedMeeting.externalId || selectedMeeting.entry_id || selectedMeeting.id;
    if (!externalId) {
      console.error('[handleProjectSelect] selectedMeeting has no valid ID:', selectedMeeting);
      projectDropdown.setIsOpen(false);
      return;
    }
    
    // Save project selection to database using the new architecture
    const success = await onUserUpdate(externalId, {
      project_id: projectId
    })
    
    console.log('[handleProjectSelect] onUserUpdate result:', success);
    
    if (success) {
      // Update local state for backward compatibility
      setMeetingProjects(prev => ({
        ...prev,
        [externalId]: projectId
      }))
    }
    
    projectDropdown.setIsOpen(false)
  }

  const loadMeetingsForDate = async (date) => {
    console.log('[loadMeetingsForDate] Loading meetings for date:', date);
    const meetings = await loadMeetingsWithDbData(date)
    console.log('[loadMeetingsForDate] Loaded', meetings.length, 'meetings');
    return meetings
  }

  const loadMeetingsForDateRange = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load meetings for selected date and next day
      const todayMeetings = await loadMeetingsForDate(selectedDate)
      
      const tomorrow = new Date(selectedDate)
      tomorrow.setDate(selectedDate.getDate() + 1)
      const tomorrowMeetings = await loadMeetingsForDate(tomorrow)
      
      setMeetings([...todayMeetings, ...tomorrowMeetings])
    } catch (error) {
      console.error('Error loading meetings:', error)
      setError('Failed to load meetings from Outlook')
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }

  const loadMeetings = async () => {
    await loadMeetingsForDateRange()
  }

  // Convert Outlook meeting to display format
  const convertOutlookMeeting = (outlookMeeting) => {
    return {
      id: outlookMeeting.entry_id || outlookMeeting.subject,
      title: outlookMeeting.subject || 'No Title',
      description: '',
      startTime: outlookMeeting.start || '',
      endTime: outlookMeeting.end || '',
      location: outlookMeeting.location || 'No Location',
      attendees: [],
      priority: 'medium',
      isRecurring: false,
      project: null
    }
  }

  // Date navigation

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getCurrentMeetings = () => {
    return meetings
  }

  const getMeetingsForDate = (date) => {
    return meetings.filter(m => m._date && m._date.toDateString() === date.toDateString())
  }

  const handleMeetingSelect = async (meeting) => {
    // Use the new selection logic that merges data
    await onMeetingSelected(meeting)
    setIsEditingNotes(false)
    setIsEditingUrl(false)
    setActiveTab('notes')
  }

  const getAllDisplayMeetings = () => {
    // Get all meetings in order: today's first, then tomorrow's
    const todayMeetings = getMeetingsForDate(selectedDate)
    const tomorrow = new Date(selectedDate)
    tomorrow.setDate(selectedDate.getDate() + 1)
    const tomorrowMeetings = getMeetingsForDate(tomorrow)
    return [...todayMeetings, ...tomorrowMeetings].map(m => convertOutlookMeeting(m))
  }

  const getCurrentMeetingIndex = () => {
    const allMeetings = getAllDisplayMeetings()
    // Compare using string IDs to handle any type mismatches
    return allMeetings.findIndex(m => String(m.id) === String(selectedMeeting?.id))
  }

  const handlePreviousMeeting = () => {
    const allMeetings = getAllDisplayMeetings()
    const currentIndex = getCurrentMeetingIndex()
    if (currentIndex > 0) {
      handleMeetingSelect(allMeetings[currentIndex - 1])
    }
  }

  const handleNextMeeting = () => {
    const allMeetings = getAllDisplayMeetings()
    const currentIndex = getCurrentMeetingIndex()
    if (currentIndex < allMeetings.length - 1) {
      handleMeetingSelect(allMeetings[currentIndex + 1])
    }
  }

  const canGoPrevious = () => {
    const currentIndex = getCurrentMeetingIndex()
    return currentIndex > 0
  }

  const canGoNext = () => {
    const allMeetings = getAllDisplayMeetings()
    const currentIndex = getCurrentMeetingIndex()
    return currentIndex < allMeetings.length - 1
  }


  const saveMeetingToDatabase = async (meeting, updateUrl = false) => {
    try {
      const entryId = meeting.entry_id || meeting.id
      
      // Check if meeting already exists in database
      const existingMeetingResponse = await invoke('get_meeting_by_outlook_id', { outlookId: entryId })
      
      if (!existingMeetingResponse.success || !existingMeetingResponse.data) {
        // Create new meeting entry - only save URL if it actually exists
        const extractedUrl = extractUrlFromLocation(meeting.location)
        const meetingData = {
          outlook_id: entryId,
          title: meeting.title,
          date: meeting.startTime ? meeting.startTime.split('T')[0] : new Date().toISOString().split('T')[0],
          start_time: meeting.startTime,
          end_time: meeting.endTime,
          location: meeting.location,
          attendees: meeting.attendees ? JSON.stringify(meeting.attendees) : null,
          meeting_url: extractedUrl, // Only save extracted URL, not null
          meeting_type: getMeetingType(meeting),
          description: null
        }
        
        const response = await invoke('create_meeting', { request: meetingData })
        if (response.success && response.data) {
          // Update meeting with database ID and URL
          meeting.db_id = response.data.id
          meeting.db_meeting_url = extractedUrl
          console.log('Meeting saved to database:', response.data)
        }
      } else {
        // Meeting already exists
        meeting.db_id = existingMeetingResponse.data.id
        meeting.db_meeting_url = existingMeetingResponse.data.meeting_url
        
        // Update URL if requested
        if (updateUrl) {
          const currentUrl = getMeetingUrl(meeting) // This gets user-added URL or extracted URL
          if (currentUrl && currentUrl !== existingMeetingResponse.data.meeting_url) {
            const updateResponse = await invoke('update_meeting_url', {
              request: {
                outlook_id: entryId,
                meeting_url: currentUrl
              }
            })
            if (updateResponse.success) {
              meeting.db_meeting_url = currentUrl
              console.log('Meeting URL updated in database:', currentUrl)
            }
          }
        } else {
          console.log('Meeting already exists in database:', existingMeetingResponse.data)
        }
      }
    } catch (error) {
      console.error('Error saving meeting to database:', error)
    }
  }

  // DTO mapping for Outlook meetings
  const mapOutlookToDto = (outlookMeeting, date) => {
    return {
      externalId: outlookMeeting.entry_id, // Stable external ID from Outlook
      subject: outlookMeeting.subject,    // Outlook uses 'subject' not 'title'
      start: outlookMeeting.start,         // Outlook uses 'start' not 'startTime'
      end: outlookMeeting.end,             // Outlook uses 'end' not 'endTime'
      location: outlookMeeting.location,
      attendees: outlookMeeting.attendees || [],
      _date: date, // Internal field for UI
      // Keep backward compatibility fields for existing UI code
      title: outlookMeeting.subject,      // Backward compatibility
      startTime: outlookMeeting.start,     // Backward compatibility
      endTime: outlookMeeting.end,         // Backward compatibility
      entry_id: outlookMeeting.entry_id,   // Backward compatibility
      id: outlookMeeting.entry_id,         // Backward compatibility
      // DB fields will be added on selection, not during load
    }
  }

  // Load meetings from Outlook only (no DB merging)
  const loadOutlookMeetings = async (date) => {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const meetingsResponse = await invoke('get_outlook_meetings', { date: dateStr })
      const outlookMeetings = meetingsResponse || []
      
      // Map to DTO structure
      return outlookMeetings.map(meeting => mapOutlookToDto(meeting, date))
    } catch (error) {
      console.error(`Error loading Outlook meetings for ${date}:`, error)
      return []
    }
  }

  // Merge strategy: Outlook = authoritative for core fields, DB = authoritative for extended fields
  const mergeMeetingData = (outlookDto, dbRecord) => {
    if (!dbRecord) {
      return outlookDto
    }
    
    // Handle both DTO format and legacy format
    const externalId = outlookDto.externalId || outlookDto.entry_id || outlookDto.id
    const subject = outlookDto.subject || outlookDto.title
    const start = outlookDto.start || outlookDto.startTime
    const end = outlookDto.end || outlookDto.endTime
    const location = outlookDto.location
    const attendees = outlookDto.attendees || []
    const _date = outlookDto._date || (start ? new Date(start) : new Date())
    
    console.log('[mergeMeetingData] Merging with fields:', { externalId, subject, start, end, location, attendees, _date });
    
    return {
      // Core fields from Outlook (authoritative) - handle both formats
      externalId,
      subject,
      start,
      end,
      location,
      attendees,
      _date,
      // Keep backward compatibility fields
      id: externalId,
      title: subject,
      startTime: start,
      endTime: end,
      entry_id: externalId,
      
      // Extended fields from DB (authoritative)
      db_id: dbRecord.id,
      db_meeting_url: dbRecord.meeting_url,
      meeting_type: dbRecord.meeting_type,
      project_id: dbRecord.project_id,
    }
  }

  // Load meetings with DB data only on selection
  const loadMeetingsWithDbData = async (date) => {
    console.log('[loadMeetingsWithDbData] Loading Outlook meetings for date:', date);
    // Step 1: Load only Outlook meetings (no DB merging during initial load)
    return await loadOutlookMeetings(date)
  }

  // Handle meeting selection - merge with DB data when selected
  const onMeetingSelected = async (meeting) => {
    console.log('[onMeetingSelected] Meeting selected:', meeting);
    try {
      // First set the basic meeting data
      setSelectedMeeting(meeting);
      
      // Then try to load and merge DB data
      const outlookId = meeting.externalId || meeting.entry_id || meeting.id;
      console.log('[onMeetingSelected] Looking up DB record for outlookId:', outlookId);
      
      if (outlookId) {
        const dbResponse = await invoke('get_meeting_by_outlook_id', { outlookId: outlookId });
        console.log('[onMeetingSelected] DB lookup response:', dbResponse);
        
        if (dbResponse.success && dbResponse.data) {
          console.log('[onMeetingSelected] Found DB record, merging data');
          // Merge DB data with the meeting
          const mergedMeeting = mergeMeetingData(meeting, dbResponse.data);
          console.log('[onMeetingSelected] Merged meeting:', mergedMeeting);
          setSelectedMeeting(mergedMeeting);
        } else {
          console.log('[onMeetingSelected] No DB record found for this meeting');
        }
      }
    } catch (error) {
      console.error('[onMeetingSelected] Error loading meeting data:', error);
      // Still set the meeting even if DB lookup fails
      setSelectedMeeting(meeting);
    }
  }

  // Handle joining a meeting
  const handleJoinMeeting = async (meeting) => {
    console.log('[handleJoinMeeting] Joining meeting:', meeting);
    const url = getMeetingUrl(meeting);
    if (url) {
      console.log('[handleJoinMeeting] Opening URL:', url);
      window.open(url, '_blank');
    } else {
      console.warn('[handleJoinMeeting] No meeting URL available');
      // Could show a toast/notification here
    }
  }


  // Partial update logic for user modifications
  const onUserUpdate = async (externalId, updatedFields) => {
    console.log('[onUserUpdate] Called with externalId:', externalId, 'updatedFields:', updatedFields);
    if (!externalId) {
      console.error('[onUserUpdate] externalId is undefined, cannot update');
      return false;
    }
    try {
      // Check if record exists in DB
      console.log('[onUserUpdate] Checking if meeting exists in DB...');
      const dbResponse = await invoke('get_meeting_by_outlook_id', { outlookId: externalId })
      console.log('[onUserUpdate] DB response:', dbResponse);
      
      if (dbResponse.success && dbResponse.data) {
        console.log('[onUserUpdate] Meeting exists in DB, id:', dbResponse.data.id);
        // Update existing record using update_meeting_url for partial updates
        const updateResponse = await invoke('update_meeting_url', {
          request: {
            outlook_id: externalId,
            meeting_url: updatedFields.meeting_url,
            project_id: updatedFields.project_id
          }
        })
        
        if (updateResponse.success) {
          console.log('[onUserUpdate] Update successful:', updateResponse.data);
          // Update local state with new data
          const updatedMeeting = {
            ...selectedMeeting,
            ...updatedFields,
            db_id: dbResponse.data.id,
            db_meeting_url: updatedFields.meeting_url || dbResponse.data.meeting_url,
            project_id: updatedFields.project_id !== undefined ? updatedFields.project_id : dbResponse.data.project_id
          }
          
          setSelectedMeeting(updatedMeeting)
          setMeetings(prevMeetings => 
            prevMeetings.map(m => 
              m.externalId === externalId ? { ...m, ...updatedFields } : m
            )
          )
          return true
        } else {
          console.error('[onUserUpdate] Update failed:', updateResponse.error);
          return false
        }
      } else {
        console.log('[onUserUpdate] Meeting not found in DB');
        // Create new record if user has provided enrichment fields (project_id or meeting_url)
        const shouldCreate = hasRequiredFields(updatedFields);
        console.log('[onUserUpdate] Should create new meeting?', shouldCreate, 'fields:', updatedFields);
        
        if (shouldCreate) {
          // Get the full meeting data from the meetings array
          const outlookMeeting = meetings.find(m => m.externalId === externalId);
          console.log('[onUserUpdate] Found outlook meeting:', outlookMeeting);
          
          if (!outlookMeeting) {
            console.error('[onUserUpdate] Cannot find meeting in local state for externalId:', externalId);
            return false;
          }
          
          const meetingData = {
            outlook_id: externalId,
            title: outlookMeeting.subject || outlookMeeting.title,
            date: outlookMeeting.start ? outlookMeeting.start.split('T')[0] : new Date().toISOString().split('T')[0],
            start_time: outlookMeeting.start || new Date().toISOString(),
            end_time: outlookMeeting.end || new Date().toISOString(),
            location: outlookMeeting.location,
            attendees: outlookMeeting.attendees ? JSON.stringify(outlookMeeting.attendees) : null,
            meeting_url: updatedFields.meeting_url || null,
            meeting_type: getMeetingType(outlookMeeting),
            project_id: updatedFields.project_id || null,
            description: null
          }
          
          console.log('[onUserUpdate] Creating meeting with data:', meetingData);
          
          const response = await invoke('create_meeting', { request: meetingData })
          console.log('[onUserUpdate] Create response:', response);
          
          if (response.success) {
            console.log('[onUserUpdate] Meeting created successfully, id:', response.data.id);
            // Update local state with new data
            const updatedMeeting = {
              ...selectedMeeting,
              ...updatedFields,
              db_id: response.data.id,
              db_meeting_url: updatedFields.meeting_url,
              project_id: updatedFields.project_id
            }
            
            setSelectedMeeting(updatedMeeting)
            setMeetings(prevMeetings => 
              prevMeetings.map(m => 
                m.externalId === externalId ? { ...m, ...updatedFields, db_id: response.data.id } : m
              )
            )
            return true
          } else {
            console.error('[onUserUpdate] Failed to create meeting:', response.error);
            return false
          }
        } else {
          console.log('[onUserUpdate] No required fields provided, updating local state only');
          // No enrichment fields provided, just update local state
          const updatedMeeting = {
            ...selectedMeeting,
            ...updatedFields
          }
          
          setSelectedMeeting(updatedMeeting)
          setMeetings(prevMeetings => 
            prevMeetings.map(m => 
              m.externalId === externalId ? { ...m, ...updatedFields } : m
            )
          )
          return true
        }
      }
    } catch (error) {
      console.error('[onUserUpdate] Error updating meeting:', error)
      return false
    }
  }

  // Check if user has provided required enrichment fields
  const hasRequiredFields = (fields) => {
    // Define what constitutes required enrichment - either URL or project assignment
    const hasUrl = fields.meeting_url && fields.meeting_url.trim()
    const hasProject = fields.project_id !== null && fields.project_id !== undefined
    console.log('🔍 DEBUG: hasRequiredFields check:', { hasUrl, hasProject, fields })
    return hasUrl || hasProject
  }

  const handleSaveUrl = async () => {
    if (selectedMeeting && editedUrl.trim()) {
      const externalId = selectedMeeting.externalId || selectedMeeting.entry_id || selectedMeeting.id;
      if (!externalId) {
        console.error('[handleSaveUrl] selectedMeeting has no valid ID:', selectedMeeting);
        setIsEditingUrl(false);
        return;
      }
      
      // Use the new partial update logic
      const success = await onUserUpdate(externalId, {
        meeting_url: editedUrl.trim()
      })
      
      if (success) {
        // Also update local meetingUrls state for backward compatibility
        setMeetingUrls(prev => ({
          ...prev,
          [externalId]: editedUrl.trim()
        }))
      }
    }
    setIsEditingUrl(false)
  }

  const handleStartEditingUrl = () => {
    // Use externalId instead of id for the new DTO structure
    const existingUrl = selectedMeeting?.db_meeting_url || meetingUrls[selectedMeeting?.externalId] || ''
    setEditedUrl(existingUrl)
    setIsEditingUrl(true)
  }

  // Extract URL from location string - looks for http/https URLs
  const extractUrlFromLocation = (location) => {
    if (!location) return null
    const urlRegex = /(https?:\/\/[^\s]+)/i
    const match = location.match(urlRegex)
    return match ? match[1] : null
  }

  const getMeetingUrl = (meeting) => {
    // First check database URL (from merged data)
    if (meeting.db_meeting_url) {
      return meeting.db_meeting_url
    }
    
    // Then check if user has saved a custom URL (backward compatibility)
    const customUrl = meetingUrls[meeting.externalId]
    if (customUrl) {
      return customUrl
    }
    
    // If no custom URL, try to extract from location field
    const location = meeting.location || ''
    const urlRegex = /(https?:\/\/[^\s]+)/
    const match = location.match(urlRegex)
    return match ? match[1] : null
  }

  const getMeetingType = (meeting) => {
    const url = getMeetingUrl(meeting)
    const location = meeting.location || ''
    
    if (url) {
      if (url.includes('zoom.us') || url.includes('zoom')) {
        return 'zoom'
      } else if (url.includes('teams.microsoft.com') || url.includes('teams')) {
        return 'teams'
      } else if (url.includes('meet.google.com') || url.includes('google')) {
        return 'google'
      }
    }
    
    // Check if it's in-person (has room info but no URL)
    if (location && !url && (location.includes('Room') || location.includes('BAN') || location.includes('PRAMUK') || location.includes('CAMPUS'))) {
      return 'in-person'
    }
    
    return 'other'
  }

  const getMeetingLocationDisplay = (meeting) => {
    const type = getMeetingType(meeting)
    const location = meeting.location || ''
    const url = getMeetingUrl(meeting)
    
    switch (type) {
      case 'zoom':
        return 'Zoom'
      case 'teams':
        return 'Teams'
      case 'google':
        return 'Google Meet'
      case 'in-person':
        return location
      case 'other':
        if (url) {
          // Extract platform from URL
          if (url.includes('zoom')) return 'Zoom'
          if (url.includes('teams')) return 'Teams'
          if (url.includes('google')) return 'Google Meet'
          return 'Online'
        }
        return location || 'No location'
      default:
        return location || 'No location'
    }
  }

  const getMultipleLocations = (meeting) => {
    const location = meeting.location || ''
    const url = getMeetingUrl(meeting)
    const locations = []
    
    // Split by semicolon and clean up
    const locationParts = location.split(';').map(part => part.trim()).filter(part => part)
    
    // Check each part for URLs or room info
    locationParts.forEach(part => {
      if (part.includes('http')) {
        // It's a URL - determine the platform
        if (part.includes('zoom.us') || part.includes('zoom')) {
          locations.push('Zoom')
        } else if (part.includes('teams.microsoft.com') || part.includes('teams')) {
          locations.push('Teams')
        } else if (part.includes('meet.google.com') || part.includes('google')) {
          locations.push('Google Meet')
        } else {
          locations.push('Online')
        }
      } else if (part.includes('Room') || part.includes('BAN') || part.includes('PRAMUK') || part.includes('CAMPUS')) {
        // It's a room location
        locations.push(part)
      } else if (part && !part.includes('http')) {
        // Other location text
        locations.push(part)
      }
    })
    
    // If no locations found but we have a URL, add it
    if (locations.length === 0 && url) {
      if (url.includes('zoom.us') || url.includes('zoom')) {
        locations.push('Zoom')
      } else if (url.includes('teams.microsoft.com') || url.includes('teams')) {
        locations.push('Teams')
      } else if (url.includes('meet.google.com') || url.includes('google')) {
        locations.push('Google Meet')
      } else {
        locations.push('Online')
      }
    }
    
    return locations.length > 0 ? locations : ['No location']
  }

  const getLocationTagColor = (location) => {
    if (location === 'Zoom') return 'bg-gray-100 text-gray-600'
    if (location === 'Teams') return 'bg-gray-100 text-gray-600'
    if (location === 'Google Meet') return 'bg-gray-100 text-gray-600'
    if (location.includes('Room') || location.includes('BAN') || location.includes('PRAMUK') || location.includes('CAMPUS')) {
      return 'bg-gray-100 text-gray-600'
    }
    return 'bg-gray-100 text-gray-600'
  }

  const getLocationIcon = (location) => {
    if (location === 'Zoom' || location === 'Teams' || location === 'Google Meet' || location === 'Online') {
      return Video
    }
    return MapPin
  }

  const getMeetingIcon = (meeting) => {
    const type = getMeetingType(meeting)
    
    switch (type) {
      case 'zoom':
      case 'teams':
      case 'google':
        return Video
      case 'in-person':
        return MapPin
      default:
        return MapPin
    }
  }

  const hasLocationUrl = (meeting) => {
    return !!extractUrlFromLocation(meeting?.location)
  }

  const handleSaveNotes = () => {
    if (selectedMeeting) {
      setMeetingNotes(prev => ({
        ...prev,
        [selectedMeeting.id]: currentNotes
      }))
      setIsEditingNotes(false)
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'No time'
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return timeString
    }
  }

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'Unknown duration'
    try {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const diff = endDate - startDate
      const minutes = Math.floor(diff / 60000)
      if (minutes < 60) return `${minutes}m`
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    } catch {
      return 'Unknown duration'
    }
  }

  return (
    <div className="h-full bg-gray-60 flex gap-4 p-4">
      {/* Left Main Content */}
      <div className="w-96 flex flex-col overflow-hidden relative">
        <div className="h-full flex flex-col">
          {/* Meeting List - Main Content */}
          <div className="w-full h-full flex flex-col">
            {/* Meeting List */}
            <div className="flex-1 overflow-auto">
              <div className="w-full h-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="bg-white p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center w-48 justify-between">
                      <button
                        onClick={handlePrevDay}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 text-center flex-1">
                        {formatDateLabel(selectedDate)}
                      </span>
                      <button
                        onClick={handleNextDay}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <button
                      onClick={handleToday}
                      className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${
                        selectedDate.toDateString() === new Date().toDateString()
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Today
                    </button>
                  </div>
                </div>
                <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">{error}</p>
                  <button
                    onClick={loadMeetings}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : getCurrentMeetings().length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No meetings scheduled</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Today's Meetings */}
                  {getMeetingsForDate(selectedDate).length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        {formatDateLabel(selectedDate)}
                      </div>
                      <div className="space-y-2">
                        {getMeetingsForDate(selectedDate).map((meeting) => {
                          const displayMeeting = convertOutlookMeeting(meeting)
                          const isSelected = selectedMeeting?.id === displayMeeting.id
                          const startTime = formatTime(displayMeeting.startTime)
                          const endTime = formatTime(displayMeeting.endTime)
                          
                          return (
                            <div
                              key={meeting.externalId || meeting.entry_id}
                              onClick={() => handleMeetingSelect(displayMeeting)}
                              className={`
                                p-3 bg-white rounded-2xl border border-gray-100
                                hover:border-gray-300 cursor-pointer transition-all duration-200 group
                                ${isSelected 
                                  ? 'border-gray-900 bg-gray-100 ring-1 ring-gray-900/20' 
                                  : 'hover:bg-gray-50'}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <h4 className="flex-1 text-sm font-medium text-gray-900 truncate">
                                  {displayMeeting.title}
                                </h4>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await handleJoinMeeting(displayMeeting)
                                  }}
                                  className="p-1.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-700 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                                >
                                  <Video className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center justify-start mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{startTime} - {endTime}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Tomorrow's Meetings */}
                  {(() => {
                    const tomorrow = new Date(selectedDate)
                    tomorrow.setDate(selectedDate.getDate() + 1)
                    return getMeetingsForDate(tomorrow).length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {formatDateLabel(tomorrow)}
                        </div>
                        <div className="space-y-2">
                          {getMeetingsForDate(tomorrow).map((meeting) => {
                            const displayMeeting = convertOutlookMeeting(meeting)
                            const isSelected = selectedMeeting?.id === displayMeeting.id
                            const startTime = formatTime(displayMeeting.startTime)
                            const endTime = formatTime(displayMeeting.endTime)
                            
                            return (
                              <div
                                key={meeting.externalId || meeting.entry_id}
                                onClick={() => handleMeetingSelect(displayMeeting)}
                                className={`
                                  p-3 bg-white rounded-2xl border border-gray-100
                                  hover:border-gray-300 cursor-pointer transition-all duration-200 group
                                  ${isSelected 
                                    ? 'border-gray-900 bg-gray-100 ring-1 ring-gray-900/20' 
                                    : 'hover:bg-gray-50'}
                                `}
                              >
                                <div className="flex items-center gap-2">
                                  <h4 className="flex-1 text-sm font-medium text-gray-900 truncate">
                                    {displayMeeting.title}
                                  </h4>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      await handleJoinMeeting(displayMeeting)
                                    }}
                                    className="p-1.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-700 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                                  >
                                    <Video className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-start mt-1">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{startTime} - {endTime}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Meeting Details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
          {selectedMeeting ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                {/* Navigation Arrows - Matching meeting list style */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePreviousMeeting}
                    disabled={!canGoPrevious()}
                    className={`p-1 rounded transition-colors ${
                      canGoPrevious()
                        ? 'hover:bg-gray-200 text-gray-600'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="Previous meeting"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMeeting}
                    disabled={!canGoNext()}
                    className={`p-1 rounded transition-colors ${
                      canGoNext()
                        ? 'hover:bg-gray-200 text-gray-600'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="Next meeting"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Meeting Title */}
                <div className="px-6 py-5 flex items-start justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-gray-900 flex-1">
                    {selectedMeeting.title}
                  </h2>
                  <div className="flex items-center flex-shrink-0">
                    {isEditingUrl ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={editedUrl}
                          onChange={(e) => setEditedUrl(e.target.value)}
                          placeholder="https://teams.microsoft.com/..."
                          className="w-64 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveUrl()
                            if (e.key === 'Escape') setIsEditingUrl(false)
                          }}
                        />
                        <button
                          onClick={handleSaveUrl}
                          className="px-3 py-1 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingUrl(false)}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getMeetingUrl(selectedMeeting) ? (
                          <>
                            <a
                              href={getMeetingUrl(selectedMeeting)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-full transition-colors"
                            >
                              <Video className="w-4 h-4" />
                              Join
                            </a>
                            {!hasLocationUrl(selectedMeeting) && (
                              <button
                                onClick={handleStartEditingUrl}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit meeting link"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={handleStartEditingUrl}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-dashed border-gray-300"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add meeting link
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Properties List */}
                <div className="px-6 space-y-4">
                  {/* Meeting Time */}
                  <div className="flex items-center">
                    <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Time</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        {formatTime(selectedMeeting.startTime)} - {formatTime(selectedMeeting.endTime)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {calculateDuration(selectedMeeting.startTime, selectedMeeting.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Meeting Location */}
                  <div className="flex items-center">
                    <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                      {(() => {
                        const Icon = getMeetingIcon(selectedMeeting)
                        return <Icon className="w-4 h-4" />
                      })()}
                      <span>Location</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      {getMultipleLocations(selectedMeeting).map((location, index) => {
                        const Icon = getLocationIcon(location)
                        return (
                          <span key={index} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getLocationTagColor(location)}`}>
                            <Icon className="w-3 h-3" />
                            {location}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Project */}
                  <div className="flex items-center">
                    <div className="w-32 flex items-center gap-2 text-sm text-gray-500">
                      <Briefcase className="w-4 h-4" />
                      <span>Project</span>
                    </div>
                    <div className="flex-1 relative dropdown-container" ref={projectDropdown.ref}>
                      <button
                        onClick={() => {
                          if (!selectedMeeting) {
                            console.warn('[ProjectDropdown] No meeting selected, cannot assign project');
                            return;
                          }
                          projectDropdown.setIsOpen(!projectDropdown.isOpen);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedMeeting?.project_id
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedMeeting?.project_id ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
                        {selectedMeeting?.project_id && projects.find(p => p.id === selectedMeeting.project_id)
                          ? projects.find(p => p.id === selectedMeeting.project_id)?.title
                          : 'No Project'}
                      </button>
                      {projectDropdown.isOpen && selectedMeeting && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 py-2 min-w-[200px] overflow-hidden">
                          <button
                            onClick={() => handleProjectSelect(null)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                              !selectedMeeting.project_id ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            No Project
                          </button>
                          {projects.map(project => (
                            <button
                              key={project.id}
                              onClick={() => handleProjectSelect(project.id)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                                selectedMeeting.project_id === project.id ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {project.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mt-6 px-6">
                  {['Notes', 'Attachments'].map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase())}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.toLowerCase()
                          ? 'text-gray-900 border-b-2 border-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      } ${index === 0 ? 'pl-0' : ''}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="px-6 py-4">
                  {activeTab === 'notes' && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Meeting Notes
                      </h3>
                      <div className="min-h-[120px]">
                        {currentNotes ? (
                          <div className="whitespace-pre-wrap text-sm text-gray-600">
                            {currentNotes}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            No notes added to this meeting.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {activeTab === 'attachments' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">No attachments yet</span>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Paperclip className="w-4 h-4" />
                          Add attachment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Calendar className="w-20 h-20 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a meeting</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default MeetingsPage
