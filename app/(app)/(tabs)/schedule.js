import { useAuth } from '../../../context/authContext';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import * as Calendar from 'expo-calendar';

export default function Schedule() {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'admin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [eventListVisible, setEventListVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  const getAllEvents = async () => {
    console.log('Loading schedule events from Supabase...');
    const { data, error } = await supabase
      .from('events')
      .select('*');
    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message);
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }
    setEvents(data || []);
    console.log('Successfully loaded schedule events.');
  };

  // fetch all events from supabase and add dots to event dates on calendar
  useEffect(() => {
    getAllEvents();
  }, []);

  // Memoize events for the selected date to avoid filtering on every render
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate || isNaN(selectedDate)) return [];
    const dateOnly = selectedDate.toISOString().split('T')[0];
    return events.filter(event => event.date === dateOnly);
  }, [events, selectedDate]);

  // Generate marked dates for the calendar
  const markedDates = useMemo(() => {
    const dates = {};

    // Add dots for all events
    events.forEach(event => {
      if (event.date) {
        dates[event.date] = { marked: true, dotColor: '#4592a1' };
      }
    });

    // Mark the selected date
    if (selectedDate && !isNaN(selectedDate)) {
      const selectedDateString = selectedDate.toISOString().split('T')[0];
      const hasEvent = !!dates[selectedDateString];

      dates[selectedDateString] = {
        ...dates[selectedDateString],
        selected: true,
        selectedColor: '#4592a1',
        // Make the dot white if selected and has an event
        dotColor: hasEvent ? 'white' : '#4592a1',
      };
    }

    return dates;
  }, [events, selectedDate]);

  // createEvent function available for admin only
  const createEvent = async () => {
    if (!name || !location || !startTime || !endTime) {
      const msg = 'Please fill in all required fields';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (loading) return; // Prevent double submission
    setLoading(true);

    try {
      const eventDate = (selectedDate instanceof Date && !isNaN(selectedDate))
        ? selectedDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('events')
        .insert([
          {
            name,
            location,
            startTime,
            endTime,
            description,
            date: eventDate,
          },
        ]);

      if (error) throw error;

      setModalVisible(false);
      await getAllEvents(); // Refresh the list

      // Reset form
      setName('');
      setLocation('');
      setStartTime('');
      setEndTime('');
      setDescription('');
    } catch (error) {
      const msg = error.message || 'An unexpected error occurred';
      Platform.OS === 'web' ? window.alert('Error: ' + msg) : Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  // open modal when user taps on date
  const handleDateChange = (date) => {
    if (!date || isNaN(date)) return;
    setSelectedDate(date);

    // Check for events using the new date directly to avoid stale state issues
    const dateString = date.toISOString().split('T')[0];
    const hasEvents = events.some(event => event.date === dateString);

    if (hasEvents) {
      setEventListVisible(true);
    }
    else {
      setModalVisible(true);
    }
  }
  // Allow users to save events to their device calendar
  const handleAddToCalendar = async (event) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const { status: remindersStatus } = await Calendar.requestRemindersPermissionsAsync();

      if (status === 'granted' && remindersStatus === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

        // Find a suitable calendar. On iOS, we look for isPrimary or 'Default'.
        // On Android, we look for calendars associated with the user's account.
        const defaultCalendar = calendars.find(cal => cal.isPrimary) ||
          calendars.find(cal => cal.source && cal.source.name === 'Default') ||
          calendars[0];

        if (defaultCalendar) {
          // Helper to ensure HH:mm format, supporting both 24h and AM/PM
          const formatTime = (timeStr) => {
            if (!timeStr) return "00:00";

            // Check for AM/PM format (e.g., "9:00 PM" or "9:00PM")
            const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (ampmMatch) {
              let [_, hours, minutes, modifier] = ampmMatch;
              hours = parseInt(hours, 10);
              if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
              if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
              return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            }

            // Fallback for standard 24h format (e.g., "14:00")
            const parts = timeStr.split(':');
            const hours = (parts[0] || '0').padStart(2, '0');
            const minutes = (parts[1] || '00').padStart(2, '0');
            return `${hours}:${minutes}`;
          };

          // Robust Date Parsing using local time
          const paddedStart = formatTime(event.startTime);
          const paddedEnd = formatTime(event.endTime);

          const start = new Date(`${event.date}T${paddedStart}:00`);
          const end = new Date(`${event.date}T${paddedEnd}:00`);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date or time format. Please use HH:mm or HH:mm AM/PM.');
          }

          await Calendar.createEventAsync(defaultCalendar.id, {
            title: event.name,
            startDate: start,
            endDate: end,
            location: event.location,
            notes: event.description || '',
            // Removing hardcoded UTC to let the device use its local timezone
          });

          if (Platform.OS === 'web') {
            window.alert('Success: Event added to your calendar!');
          } else {
            Alert.alert('Success', 'Event added to your calendar!');
          }
        } else {
          throw new Error('No writable calendar found on this device.');
        }
      } else {
        const msg = 'Calendar or Reminders permission denied. Please check your settings.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Permission Denied', msg);
      }
    } catch (error) {
      console.error('Calendar Error:', error);
      const msg = error.message || 'Could not add event to calendar.';
      Platform.OS === 'web' ? window.alert('Error: ' + msg) : Alert.alert('Error', msg);
    }
  }

  // Allow admin to delete/edit events
  const deleteEvent = async (event) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id);

    if (error) throw error;

    await getAllEvents();
    setEventListVisible(false);
  }

  const editEvent = (event) => {
    setEditingEventId(event.id);
    setName(event.name);
    setLocation(event.location);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setDescription(event.description || '');
    setIsEdit(true);
    setEventListVisible(false);
    setModalVisible(true);
  }

  const handleEditEvent = async () => {
    if (!name || !location || !startTime || !endTime) {
      const msg = 'Please fill in all required fields';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({
          name,
          location,
          startTime,
          endTime,
          description,
        })
        .eq('id', editingEventId);

      if (error) throw error;

      setModalVisible(false);
      setIsEdit(false);
      setEditingEventId(null);
      await getAllEvents();

      setName('');
      setLocation('');
      setStartTime('');
      setEndTime('');
      setDescription('');
    } catch (error) {
      const msg = error.message || 'An unexpected error occurred';
      Platform.OS === 'web' ? window.alert('Error: ' + msg) : Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <RNCalendar
        onDayPress={(day) => {
          const selected = new Date(day.dateString); // safely parse the string directly
          handleDateChange(selected);
        }}
        theme={{
          selectedDayBackgroundColor: '#4592a1',
          selectedDayTextColor: '#ffffff',
          arrowColor: '#4592a1',
          todayTextColor: '#4592a1',
          dotColor: '#4592a1',
        }}
        markedDates={markedDates}
      />
      {eventsForSelectedDate.length > 0 && (
        <Modal
          animationType='slide'
          transparent={true}
          visible={eventListVisible}
          onRequestClose={() => setEventListVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-5">
            {eventsForSelectedDate.map((event) => (
              <View key={event.id} className="w-full bg-white p-6 rounded-2xl shadow-lg mb-4">
                <Text className="text-xl font-bold mb-2 text-center">{event.name}</Text>
                <Text className="text-gray-600 text-center mb-1">{event.startTime} - {event.endTime}</Text>
                <Text className="text-gray-600 text-center mb-3">{event.location}</Text>
                {event?.description && (
                  <Text className="text-gray-700 mb-4 text-center">{event.description}</Text>
                )}
                {isAdmin && (
                  <View className="flex-row gap-2 justify-center">
                    <TouchableOpacity
                      onPress={() => editEvent(event)}
                      className="bg-[#4592a1] flex-1 p-3 rounded-lg items-center"
                    >
                      <Text className="text-white font-bold">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteEvent(event)}
                      className="bg-red-500 flex-1 p-3 rounded-lg items-center"
                    >
                      <Text className="text-white font-bold">Delete</Text>
                    </TouchableOpacity>
                  </View>)}
                <View className="flex-row gap-2 justify-center">
                  <TouchableOpacity
                    onPress={() => handleAddToCalendar(event)}
                    className="bg-blue-500 flex-1 p-3 rounded-lg items-center"
                  >
                    <Text className="text-white font-bold">Add to Calendar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEventListVisible(false)}
                    className="bg-gray-500 flex-1 p-3 rounded-lg items-center"
                  >
                    <Text className="text-white font-bold">Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {isAdmin && (
              <View className="w-full gap-2">
                <TouchableOpacity
                  onPress={() => { setModalVisible(true); setEventListVisible(false); setIsEdit(false); }}
                  className="bg-[#4592a1] p-3 rounded-lg items-center"
                >
                  <Text className="text-white font-bold">Add Another Event</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      )}
      <Modal
        animationType='slide'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          {isAdmin ? (/* Add event form for admin only */
            <View className="w-full bg-white p-6 rounded-2xl shadow-lg">
              <Text className="text-xl font-bold mb-4 text-center">Add Event</Text>
              <TextInput
                className="border border-gray-300 p-3 rounded-lg mb-3"
                placeholder="Event Name"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                className="border border-gray-300 p-3 rounded-lg mb-3"
                placeholder="Event Location"
                value={location}
                onChangeText={setLocation}
              />
              <TextInput
                className="border border-gray-300 p-3 rounded-lg mb-3"
                placeholder="Event Start Time"
                value={startTime}
                onChangeText={setStartTime}
              />
              <TextInput
                className="border border-gray-300 p-3 rounded-lg mb-3"
                placeholder="Event End Time"
                value={endTime}
                onChangeText={setEndTime}
              />
              <TextInput
                className="border border-gray-300 p-3 rounded-lg mb-4"
                placeholder="Event Description"
                value={description}
                onChangeText={setDescription}
              />
              {isEdit ? (
                <TouchableOpacity className="bg-[#4592a1] p-3 rounded-lg items-center mb-2" onPress={handleEditEvent}>
                  <Text className="text-white font-bold">Update Event</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity className="bg-[#4592a1] p-3 rounded-lg items-center mb-2" onPress={createEvent}>
                  <Text className="text-white font-bold">Create Event</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity className="bg-gray-200 p-3 rounded-lg items-center" onPress={() => {
                setModalVisible(false);
                setIsEdit(false);
                setEditingEventId(null);
                setName('');
                setLocation('');
                setStartTime('');
                setEndTime('');
                setDescription('');
              }}>
                <Text className="text-gray-700 font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : ( /* View events for non-admin users */
            <View className="w-full bg-white p-6 rounded-2xl shadow-lg">
              <Text className="text-xl font-bold mb-4 text-center">Events for {selectedDate.toDateString()}</Text>
              {eventsForSelectedDate.length === 0 ? (
                <Text className="text-gray-500 text-center mb-4">No events for this date.</Text>
              ) : (
                eventsForSelectedDate.map(event => (
                  <View key={event.id} className="mb-4 border-b border-gray-100 pb-2">
                    <Text className="font-bold text-lg">{event.name}</Text>
                    <Text className="text-gray-600">{event.startTime} - {event.endTime}</Text>
                    <Text className="text-gray-600">{event.location}</Text>
                    {event.description ? <Text className="text-gray-500 mt-1">{event.description}</Text> : null}
                  </View>
                ))
              )}
              <TouchableOpacity className="bg-[#4592a1] p-3 rounded-lg items-center mt-2" onPress={() => setModalVisible(false)}>
                <Text className="text-white font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}