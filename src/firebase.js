import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBibCd54gcah0765Xp0uHk5eJpOagj3eYE",
  authDomain: "tournoi-ping-pong.firebaseapp.com",
  databaseURL: "https://tournoi-ping-pong-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tournoi-ping-pong",
  storageBucket: "tournoi-ping-pong.firebasestorage.app",
  messagingSenderId: "758639108445",
  appId: "1:758639108445:web:67743a17a7a923050488b4"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export const saveTournament = async (tournament) => {
  await set(ref(db, `tournaments/${tournament.key}`), tournament)
}

export const loadTournament = async (key) => {
  const snap = await get(ref(db, `tournaments/${key}`))
  return snap.exists() ? snap.val() : null
}