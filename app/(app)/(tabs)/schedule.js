/*import { StyleSheet, View, Text, TextInput, Button, Platform, Alert, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/authContext.js'
import CustomKeyboardView from '../../../components/CustomKeyboardView.js'
//import { query, getDocs, where, doc, getDoc, addDoc, collection } from 'firebase/firestore';
//import { db, usersRef, eventsRef } from '../../../firebaseConfig.js';
import CalendarPicker from 'react-native-calendar-picker'
import * as Calendar from "expo-calendar";
import { parse, setHours, setMinutes, format, set } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ca } from 'date-fns/locale';
import { supabase } from '../../../lib/supabase';

//const schedule = () => {
export default function Schedule() {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'admin';
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  const parseEventDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return new Date(); // Default to now
    try {
      // Parse the date string as local time (not UTC)
      const baseDate = parse(dateString, 'yyyy-MM-dd', new Date());
      // Parse time string (e.g., "10:00 AM")
      const [time, period] = timeString.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      // Convert 12-hour to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      // Set hours and minutes on the date
      const finalDate = setHours(setMinutes(baseDate, minutes || 0), hours);
      return finalDate;
    } catch (error) {
      console.error('Error parsing event date/time:', error);
      return new Date();
    }
  };

  const openEventModal = () => {
    setEventModalVisible(true);
  }

  // Update onDateChange to handle modal visiblity upon selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setModalVisible(true);
  }

  // get events for selected date (for display in modal)
  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateString = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateString);
  };

  // fetch all events to highlight events on calendar
  const getEvents = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;

      console.log('Query returned:', data ? data.length : 0, 'documents'); // Debug log
      setEvents(data || []);
      console.log('Fetched events:', data);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error fetching events:', error.message);
    }
  }

  // to add to device calendar
  const handleAddToCalendar = async (date) => {
    try {
      // Check permissions first
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status != 'granted') {
        Alert.alert('Permission to access calendar was denied');
        return;
      }

      // Get events for the selected date
      const eventsForDate = getEventsForDate(date);
      if (eventsForDate.length === 0) {
        Alert.alert('No Events', 'No events found for this date.');
        return;
      }

      let calendarId;
      try {
        calendarId = await createCalendar();
      } catch (calError) {
        console.error('Error creating calendar:', calError);
        Alert.alert('Error', 'Failed to create calendar.');
        return;
      }

      // Add each event to the device calendar
      for (const event of eventsForDate) {
        const startDate = parseEventDateTime(event.date, event.startTime); // Use helper
        const endDate = parseEventDateTime(event.date, event.endTime); // Use helper
        await Calendar.createEventAsync(calendarId, {
          startDate,
          endDate,
          title: event.name,
          location: event.location || '',
          notes: event.description || '',
        });
        console.log({ startDate, endDate });
      }
      Alert.alert('Success', `${eventsForDate.length} event(s) added to your calendar!`);
    } catch (error) {
      console.error('Error adding events to device calendar:', error);
    }
  }

  // need to check if user is admin or not
  useEffect(() => {
    (async () => {
      console.log('Requesting calendar permission...');
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      console.log('Calendar permission status:', status);
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(
          Calendar.EntityTypes.EVENT
        );
        console.log('Here are all your calendars:');
        console.log({ calendars });
      }
    })();

    console.log('Schedule: user type:', user?.userType);
    getEvents();
  }, []);

  const getCustomDatesStyles = date => {
    const calendarDateString = format(date, 'yyyy-MM-dd');
    const eventExists = events.some(event => {
      //console.log('event.date:', event.date);
      return event.date === calendarDateString;
    });
    if (eventExists) {
      return {
        style: {
          backgroundColor: '#f0a743',
          borderRadius: 15,
        },
        textStyle: {
          color: 'white',
          fontWeight: 'bold',
        },
      };
    }
    return {};
  }


  async function getDefaultCalendarSource() {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    const defaultCalendars = calendars.filter(
      (each) => each.source.name === 'Default'
    );
    return defaultCalendars.length
      ? defaultCalendars[0].source
      : calendars[0].source;
  }

  // creates new calendar to add to OS calendars
  // keeps getfit30 events organized from other calendar events
  async function createCalendar() {
    // check if we already have a calendar ID stored, prevent making duplicates
    let calendarId = await AsyncStorage.getItem('getfit30CalendarId');
    if (calendarId) {
      console.log('Reusing existing calendar ID:', calendarId);
      return calendarId;
    }

    // no calendar ID stored, create new calendar
    const defaultCalendarSource =
      Platform.OS === 'ios'
        ? await getDefaultCalendarSource()
        : { isLocalAccount: true, name: 'getfit30 Calendar' };
    const newCalendarID = await Calendar.createCalendarAsync({
      title: 'getfit30 Calendar',
      color: '#4592a1',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource,
      name: 'internalCalendarName',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    // store calendar ID for future use
    await AsyncStorage.setItem('getfit30CalendarId', newCalendarID);
    console.log(`Your new calendar ID is: ${newCalendarID}`);
    return newCalendarID;
  }

  // saves new event to in-app calendar
  const createEvent = async () => {
    try {
      // Validate required fields
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter an event name.');
        return;
      }
      if (!location.trim()) {
        Alert.alert('Error', 'Please enter an event location.');
        return;
      }
      if (!startTime.trim()) {
        Alert.alert('Error', 'Please enter a start time.');
        return;
      }
      if (!endTime.trim()) {
        Alert.alert('Error', 'Please enter an end time.');
        return;
      }
      const eventData = {
        name,
        location,
        startTime,
        endTime,
        description,
        date: format(selectedDate, 'yyyy-MM-dd'),
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single(); // Add new event entry to Supabase

      if (error) throw error;
      console.log('Added document with ID: ', data.id);
      // Reset the form
      setName('');
      setLocation('');
      setStartTime('');
      setEndTime('');
      setDescription('');
      // close modals
      setEventModalVisible(false);
      setModalVisible(false);
      await getEvents();
      Alert.alert('Event Created!');
      // TODO: Investigate why app freezes upon creating a new event in the calendar UI
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event.');
    }
  };


  return (
    <CustomKeyboardView>
      <View>
        <CalendarPicker
          onDateChange={handleDateChange}
          customDatesStyles={getCustomDatesStyles}
          selectedDayColor='#4592a1'
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Events for {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'Selected Date'}
              </Text>
              {selectedDate && getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map((event, index) => (
                  <Text key={index} style={styles.eventText}>
                    {event.name} ({event.startTime} - {event.endTime}){'\n'}
                    {event.location || 'No location'}{'\n'}
                    {event.description || 'No description'}
                  </Text>
                ))
              ) : (
                <Text>No events for this date.</Text>
              )}
              {isAdmin && <Button title="Add new event" onPress={openEventModal} />}
              {getEventsForDate(selectedDate).length > 0 && <Button title="Add event(s) to device calendar" onPress={() => handleAddToCalendar(selectedDate)} />}
              <Button title="Close" onPress={() => setModalVisible(false)} />
              <Modal
                animationType="slide"

                transparent={true}
                visible={eventModalVisible}
                onRequestClose={() => setEventModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      New Event Details
                    </Text>
                    <TextInput
                      onChangeText={setName}
                      value={name}
                      placeholder="Name of your event"
                      style={styles.input}
                    />
                    <TextInput
                      onChangeText={setLocation}
                      value={location}
                      placeholder="Location of your event"
                      style={styles.input}
                    />
                    <TextInput
                      onChangeText={setStartTime}
                      value={startTime}
                      placeholder="Start time of your event (e.g. 10:00 AM)"
                      style={styles.input}
                    />
                    <TextInput
                      onChangeText={setEndTime}
                      value={endTime}
                      placeholder="End time of your event (e.g. 11:00 AM)"
                      style={styles.input}
                    />
                    <TextInput
                      onChangeText={setDescription}
                      value={description}
                      placeholder="Description of your event"
                      style={styles.input}
                    />
                    <Button title="Create event" onPress={createEvent} />
                    <Button title="Close" onPress={() => setEventModalVisible(false)} />
                  </View>
                </View>
              </Modal>
            </View>
          </View>
        </Modal>
      </View>
    </CustomKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
  },
  dateText: {
    margin: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventText: {
    fontSize: 16,
    marginVertical: 5,
  },
  noEventsText: {
    fontSize: 16,
    color: 'gray',
    marginVertical: 10,
  },
});*/