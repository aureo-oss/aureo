import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db } from './firebase';
import { doc, collection, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function CalendarNotes() {
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState({});
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle auth state properly
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
      
      // Clear notes when user logs out
      if (!user) {
        setSavedNotes({});
        setNote('');
      }
    });
    return unsubscribe;
  }, []);

  // Fetch notes when user changes
  useEffect(() => {
    if (!user) return;

    let unsubscribe;
    const fetchNotes = async () => {
      try {
        const notesRef = collection(db, 'userNotes', user.uid, 'notes');
        unsubscribe = onSnapshot(notesRef, 
          (snapshot) => {
            const notes = {};
            snapshot.forEach((doc) => {
              notes[doc.id] = doc.data().text;
            });
            setSavedNotes(notes);
          },
          (error) => {
            console.error("Error fetching notes:", error);
          }
        );
      } catch (error) {
        console.error("Error setting up listener:", error);
      }
    };

    fetchNotes();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Update displayed note when date changes
  useEffect(() => {
    const dateKey = date.toISOString().split('T')[0];
    setNote(savedNotes[dateKey] || '');
  }, [date, savedNotes]);

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const dateKey = date.toISOString().split('T')[0];
      const noteRef = doc(db, 'userNotes', user.uid, 'notes', dateKey);
      await setDoc(noteRef, { 
        text: note,
        date: dateKey,
        userId: user.uid,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  if (isLoading) {
    return <div>Loading calendar...</div>;
  }

  if (!user) {
    return <div>Please sign in to view and save notes</div>;
  }

  return (
    <div style={{ marginTop: '40px', background: '#1a1a1a', padding: '20px', borderRadius: '10px' }}>
      <h2 style={{ color: '#facc15' }}>📅 Calendar Notes</h2>
      <Calendar onChange={setDate} value={date} />
      <p style={{ marginTop: '20px', color: '#ccc' }}>
        <strong>Note for:</strong> {date.toDateString()}
      </p>
      <textarea
        rows="4"
        cols="50"
        style={{
          width: '100%',
          padding: '12px',
          background: '#2a2a2a',
          color: 'white',
          border: '1px solid #444',
          borderRadius: '8px',
          marginBottom: '10px'
        }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write your follow-up note here..."
      />
      <br />
      <button
        onClick={handleSave}
        style={{
          padding: '10px 20px',
          background: '#facc15',
          color: '#111',
          border: 'none',
          borderRadius: '20px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        💾 Save Note
      </button>
    </div>
  );
}