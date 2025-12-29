import { StyleSheet, View, Text, TextInput, Button, Platform, Alert, Modal } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/authContext.js'
import { query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db, usersRef, eventsRef } from '../../../firebaseConfig.js';
import CalendarPicker from 'react-native-calendar-picker'
import * as Calendar from "expo-calendar";
import { format } from 'date-fns';

//const schedule = () => {
export default function Schedule() {
    const {user} = useAuth();
    const [events, setEvents] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [description, setDescription] = useState("");
    const day = selectedDate 
        ? (selectedDate instanceof Date //('YYYY-MM-DD').toString() 
          ? selectedDate.toISOString().slice(0, 10)
          : String(selectedDate))
        : '';
    const [modalVisible, setModalVisible] = useState(false);

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
        const q = query(eventsRef);
        const querySnapshot = await getDocs(q);
        console.log('Query returned:', querySnapshot.size, 'documents'); // Debug log
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({id: doc.id, ...doc.data()});
        })
        setEvents(data);
        console.log('Fetched events:', data);
      } catch (error) {
        console.error('Error fetching events:', error);
        Alert.alert('Error fetching events:', error.message);
      }
    }

    // need to check if user is admin or not
    useEffect(()=>{
      console.log('Schedule: user type:', user?.userType);
      if (user?.uid) {
        getUserType();
      }
      getEvents();
    },[user?.uid])

    const getCustomDatesStyles = date => {
      const calendarDateString = format(date, 'yyyy-MM-dd');
      const eventExists = events.some(event => {
        //console.log('event.date:', event.date);
        return event.date === calendarDateString;
      });
      if (eventExists) {
        return {
          style: {
            backgroundColor: 'darkorange',
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

    const getUserType = async ()=>{
      // fetch user
      try {
        console.log('getUserType: running query for', user?.uid);
        const q = query(usersRef, where('userId', '==', user?.uid));
        const querySnapshot = await getDocs(q);
        console.log('getUserType: snapshot size =', querySnapshot.size);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setIsAdmin(data.userType === 'admin');
          console.log('isAdmin =', data.userType);
          return;
        }
        // Fallback: try reading document by UID (if UID is the doc id)
        const docRef = doc(usersRef.firestore || usersRef, 'users', user?.uid); // safe construction may vary
        const directSnap = await getDoc(docRef);
        if (directSnap.exists()) {
          const data = directSnap.data();
          setIsAdmin(data.userType === 'admin');
          console.log('isAdmin (from doc id) =', data.userType);
          return;
        }
        console.log('getUserType: no matching user document');
      } catch (err) {
        console.error('getUserType error:', err);
      }
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

    async function createCalendar() {
      const defaultCalendarSource =
      Platform.OS === 'ios'
        ? await getDefaultCalendarSource()
        : { isLocalAccount: true, name: 'Expo Calendar' };
      const newCalendarID = await Calendar.createCalendarAsync({
        title: 'Expo Calendar',
        color: 'blue',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendarSource.id,
        source: defaultCalendarSource,
        name: 'internalCalendarName',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      console.log(`Your new calendar ID is: ${newCalendarID}`);
      return newCalendarID;
    }

    // saves new event to calendar
    const addNewEvent = async () => {
        try {
            const calendarId = await createCalendar();
      
            const res = await Calendar.createEventAsync(calendarId, {
                endDate: getAppointmentDate(startDate),
                startDate: getAppointmentDate(startDate),
                name: name,
                location: location,
                startTime: startTime,
                endTime: endTime,
                description: description,
                eventDate: eventDate,
        });
      Alert.alert('Event Created!');
    } catch (e) {
      console.log(e);
    }};

    useEffect(() => {
        (async ()=> {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status === 'granted' ) {
                const calendars = await Calendar.getCalendarsAsync(
                    Calendar.EntityTypes.EVENT
                );
                console.log('Here are all your calendars:');
                console.log({ calendars });
            }
        })();
    }, []);
    return (
        <View>
            {/*<TextInput
                onChangeText={setName}
                value={name}
                placeholder="Name of your event"
                style={styles.input}
                editable={isAdmin}
            />
            <TextInput
                onChangeText={setLocation}
                value={location}
                placeholder="Location of your event"
                style={styles.input}
                editable={isAdmin}
            />*/}
            <CalendarPicker 
              onDateChange={handleDateChange}
              customDatesStyles={getCustomDatesStyles}
              selectedDayColor='darkturquoise'
              //onMonthChange={handleMonthChange}
            />
            <Text style={styles.dateText}>Date selected: {day}</Text>
            <Button title={"Add to calendar"} onPress={addNewEvent} disabled={!isAdmin} />
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              {/* Modal content only showing when modal visiblity is true */}
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
                  <Button title="Close" onPress={() => setModalVisible(false)} />
                </View>
              </View>
            </Modal>
        </View>
    )
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
});