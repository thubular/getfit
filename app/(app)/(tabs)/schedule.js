import { useAuth } from '../../../context/authContext';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function Schedule() {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'admin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [eventListVisible, setEventListVisible] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  const getAllEvents = async () => {
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
      // change selected date to today again after event creation
      setSelectedDate(new Date());

    } catch (error) {
      const msg = error.message || 'An unexpected error occurred';
      Platform.OS === 'web' ? window.alert('Error: ' + msg) : Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  // open modal when user taps on date
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (eventsForSelectedDate.length > 0) {
      setEventListVisible(true);
    }
    else {
      setModalVisible(true);
    }
  }
  // Allow users to save events to their device calendar
  const handleAddToCalendar = (date) => {
    // TODO: Implement event saving to device calendar
  }

  // Allow admin to delete/edit events
  const deleteEvent = async (id) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await getAllEvents();
  }

  const editEvent = async (id, updates) => {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    await getAllEvents();
  }

  return (
    <View>
      <Calendar
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
              <View key={event.id} className="w-full bg-white p-6 rounded-2xl shadow-lg">
                <TouchableOpacity onPress={() => deleteEvent(event.id)} className="bg-red-500 p-3 rounded-lg items-center mt-2">
                  <Text className="text-white font-bold">Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => editEvent(event.id)} className="bg-[#4592a1] p-3 rounded-lg items-center mt-2">
                  <Text className="text-white font-bold">Edit</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold mb-4 text-center">{event.name}</Text>
                <Text className="text-xl font-bold mb-4 text-center">{event.startTime} - {event.endTime}</Text>
                <Text className="text-xl font-bold mb-4 text-center">{event.location}</Text>
                {event?.description ? (
                  <Text className="text-gray-700">{event?.description}</Text>
                ) : (
                  <Text className="text-gray-700">No description</Text>
                )}
                <TouchableOpacity onPress={() => handleAddToCalendar(event)} className="bg-blue-500 p-3 rounded-lg items-center mt-2">
                  <Text className="text-white font-bold">Add to Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setModalVisible(true); setEventListVisible(false) }} className="bg-[#4592a1] p-3 rounded-lg items-center mt-2">
                  <Text className="text-white font-bold">Add Event</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => setEventListVisible(false)} className="bg-red-500 p-3 rounded-lg items-center mt-2">
              <Text className="text-white font-bold">Close</Text>
            </TouchableOpacity>
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
              <TouchableOpacity className="bg-[#4592a1] p-3 rounded-lg items-center mb-2" onPress={createEvent}>
                <Text className="text-white font-bold">Create Event</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-200 p-3 rounded-lg items-center" onPress={() => setModalVisible(false)}>
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