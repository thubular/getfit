import { StyleSheet, View, Text, TextInput, Button, Platform, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/authContext'
import { query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { usersRef } from '../../firebaseConfig.js';
import CalendarPicker from 'react-native-calendar-picker'
import * as Calendar from "expo-calendar";

//const schedule = () => {
export default function Schedule() {
    const {user} = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState(null);
    const [eventName, setEventName] = useState("");
    const [zoomLink, setLink] = useState("");
    const startDate = selectedStartDate 
        ? (selectedStartDate instanceof Date //('YYYY-MM-DD').toString() 
          ? selectedStartDate.toISOString().slice(0, 10)
          : String(selectedStartDate))
        : '';
    
    // need to check if user is admin or not
    useEffect(()=>{
      console.log('Schedule: user type:', user?.userType);
      if (user?.uid) {
        getUserType();
      }
    },[user?.uid])
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
                endDate: getAppointementDate(startDate),
                startDate: getAppointementDate(startDate),
                title: eventName,
                link: zoomLink
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
            <TextInput
                onChangeText={setEventName}
                value={eventName}
                placeholder="Name of your event"
                style={styles.input}
                editable={isAdmin}
            />
            <TextInput
                onChangeText={setLink}
                value={zoomLink}
                placeholder="Zoom Link"
                style={styles.input}
                editable={isAdmin}
            />
            <CalendarPicker onDateChange={setSelectedStartDate} />
            <Text style={styles.dateText}>Date: {startDate}</Text>
            <Button title={"Add to calendar"} onPress={addNewEvent} disabled={!isAdmin} />
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
});