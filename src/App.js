import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signOut as firebaseSignOut,
    signInWithCustomToken,
    signInAnonymously
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';

// --- Firebase Configuration ---
// This is now your real project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyD2Q_M1tUmEELmYZJekOJCCTYtwlM-_2DU",
  authDomain: "redmonkys-circle-ultimate.firebaseapp.com",
  projectId: "redmonkys-circle-ultimate",
  storageBucket: "redmonkys-circle-ultimate.firebasestorage.app",
  messagingSenderId: "337937977339",
  appId: "1:337937977339:web:b76ae3d7da470558b0855e",
  measurementId: "G-7P6JRHKNMK"
};


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionId, setCurrentQuestionId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setUserData(data);
                    if (!data.username) setPage('setUsername');
                    else if (!data.onboardingComplete) setPage('onboarding');
                    else if (page !== 'question') setPage('feed');
                } else {
                    setPage('setUsername');
                }
            } else {
                setUser(null);
                setUserData(null);
                setPage('home');
            }
            setLoading(false);
        });

        const performSignIn = async () => {
            if (!auth.currentUser) {
                try {
                   // For the proxy, we'll rely on anonymous sign-in initially.
                   // A more advanced setup could pass a customer token from Shopify.
                   await signInAnonymously(auth);
                } catch (error) {
                    console.error("Error during automatic sign-in:", error);
                    setLoading(false);
                }
            }
        };

        performSignIn();
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await firebaseSignOut(auth);
            setPage('home');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const navigateTo = (pageName, questionId = null) => {
        setPage(pageName);
        setCurrentQuestionId(questionId);
    };

    if (loading) return <LoadingScreen />;

    const renderPage = () => {
        switch (page) {
            case 'home': return <WelcomePage />;
            case 'setUsername': return <SetUsernamePage user={user} onComplete={() => navigateTo('onboarding')} />;
            case 'onboarding': return <OnboardingPage user={user} onComplete={() => navigateTo('feed')} />;
            case 'feed': return <CommunityFeed navigateTo={navigateTo} user={user} />;
            case 'question': return <QuestionDetailPage questionId={currentQuestionId} user={user} userData={userData} navigateTo={navigateTo} />;
            case 'profile': return <ProfilePage user={user} userData={userData} setUserData={setUserData} onComplete={() => navigateTo('feed')} />;
            case 'ask': return <AskQuestionPage user={user} userData={userData} onComplete={(id) => navigateTo('question', id)} />;
            default: return <WelcomePage />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Header user={user} userData={userData} onLogout={handleLogout} navigateTo={navigateTo} />
            <main className="container mx-auto px-4 py-8">
                {renderPage()}
            </main>
        </div>
    );
}

// --- Components ---

const brandColor = '#6d0b0b';

function Header({ user, userData, onLogout, navigateTo }) {
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-2xl font-bold cursor-pointer" style={{ color: brandColor }} onClick={() => navigateTo(user ? 'feed' : 'home')}>
                    RedMonkys Circle
                </div>
                {user && userData?.username && (
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigateTo('ask')} style={{ backgroundColor: brandColor }} className="text-white px-4 py-2 rounded-full hover:bg-[#5a0909] transition duration-300 font-semibold">
                            Ask Question
                        </button>
                        <div className="relative group">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 cursor-pointer">
                                {userData.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
                                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('profile'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}

function WelcomePage() {
    return (
        <div className="text-center py-16 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">🤍 Welcome to RedMonkys Circle.</h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                This space is made just for you — the loving, curious, sometimes-tired, always-caring parent. Whether you have questions, stories, doubts, or advice — you're not alone. Ask freely. Share generously. Support each other. At RedMonkys, we believe that every parent/guardian deserves to be heard, and every child deserves a world full of love, understanding, and growth. This is a judgment-free zone — a gentle corner of the internet where you’re seen, your concerns matter, and your voice helps others feel a little less alone.
                <br/><br/>
                <strong>Together, we’re building more than a brand. We’re building a community of care.</strong>
            </p>
            <button onClick={() => {}} className="bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex items-center mx-auto">
                <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.87-2.13 15.84-5.73l-7.73-6c-2.52 1.7-5.94 2.73-9.91 2.73-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                Login with Google
            </button>
        </div>
    );
}

function SetUsernamePage({ user, onComplete }) {
    const [username, setUsername] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [isAvailable, setIsAvailable] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const checkUsernameAvailability = useMemo(() => {
        const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), delay); }; };
        return debounce(async (name) => {
            if (name.length > 2) {
                setLoading(true);
                const usernameDocRef = doc(db, 'usernames', name);
                const docSnap = await getDoc(usernameDocRef);
                setIsAvailable(!docSnap.exists()); setLoading(false);
            }
        }, 500);
    }, []);

    const handleUsernameChange = (e) => {
        const value = e.target.value.toLowerCase();
        const regex = /^[a-z0-9_]+$/;
        setUsername(value);
        if (regex.test(value) && value.length >= 3 && value.length <= 15) {
            setIsValid(true); setError(''); checkUsernameAvailability(value);
        } else {
            setIsValid(false); setError('3-15 chars, lowercase, numbers, or _');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid || !isAvailable || loading || !user) return;
        setLoading(true); setError('');
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const usernameDocRef = doc(db, 'usernames', username);
            await setDoc(userDocRef, { uid: user.uid, email: user.email || 'anonymous', username: username, createdAt: serverTimestamp() }, { merge: true });
            await setDoc(usernameDocRef, { uid: user.uid });
            onComplete();
        } catch (err) {
            console.error(err); setError('Could not save username. Please try again.'); setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create your username</h2>
            <p className="text-gray-600 mb-6">This is permanent and will be shown with your questions and answers.</p>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">@</span>
                    <input type="text" value={username} onChange={handleUsernameChange} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#6d0b0b] focus:border-[#6d0b0b]" placeholder="your_unique_username"/>
                </div>
                <div className="h-5 mt-1 text-sm">
                    {loading && <p className="text-gray-500">Checking...</p>}
                    {!loading && username && !isAvailable && <p className="text-red-500">Username already taken.</p>}
                    {!loading && username && isAvailable && isValid && <p className="text-green-500">Username is available!</p>}
                    {error && <p className="text-red-500">{error}</p>}
                </div>
                <button type="submit" disabled={!isValid || !isAvailable || loading} style={{ backgroundColor: brandColor }} className="w-full mt-4 text-white py-2 px-4 rounded-md hover:bg-[#5a0909] disabled:bg-gray-400 transition">
                    Confirm Username
                </button>
            </form>
        </div>
    );
}

function OnboardingPage({ user, onComplete }) {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('');
    const [children, setChildren] = useState([{ name: '', dob: '', gender: '' }]);
    const [dueDate, setDueDate] = useState({ month: '', year: '' });
    const [referral, setReferral] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRoleSelect = (selectedRole) => { setRole(selectedRole); setStep(2); };
    const handleAddChild = () => { setChildren([...children, { name: '', dob: '', gender: '' }]); };
    const handleChildChange = (index, field, value) => { const newChildren = [...children]; newChildren[index][field] = value; setChildren(newChildren); };
    const handleRemoveChild = (index) => { const newChildren = children.filter((_, i) => i !== index); setChildren(newChildren); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!referral) { alert("Please let us know how you heard about us."); return; }
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const onboardingData = { role, children: role === 'parent' ? children.filter(c => c.name || c.dob || c.gender) : [], dueDate: role === 'expecting' ? dueDate : {}, referral, onboardingComplete: true, updatedAt: serverTimestamp() };
        try { await setDoc(userDocRef, onboardingData, { merge: true }); onComplete(); } catch (error) { console.error("Error saving onboarding data:", error); setLoading(false); }
    };

    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear(); const currentMonth = new Date().getMonth() + 1;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({length: 10}, (_, i) => currentYear + i);

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tell us a bit about yourself</h2>
            <p className="text-gray-600 mb-8">This helps us personalize your experience.</p>
            {step === 1 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">First, what best describes you?</h3>
                    <button onClick={() => handleRoleSelect('parent')} className="w-full text-left p-4 border rounded-lg hover:bg-red-50 hover:border-[#6d0b0b] transition">I'm a parent / guardian</button>
                    <button onClick={() => handleRoleSelect('expecting')} className="w-full text-left p-4 border rounded-lg hover:bg-red-50 hover:border-[#6d0b0b] transition">I will be a parent soon</button>
                    <button onClick={() => handleRoleSelect('not_parent')} className="w-full text-left p-4 border rounded-lg hover:bg-red-50 hover:border-[#6d0b0b] transition">I'm not a parent</button>
                </div>
            )}
            {step === 2 && (
                <form onSubmit={handleSubmit}>
                    {role === 'parent' && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-4">Tell us about your child/children.</h3>
                            {children.map((child, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg mb-4 relative">
                                    {children.length > 1 && <button type="button" onClick={() => handleRemoveChild(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">&times;</button>}
                                    <div><label className="block text-sm font-medium text-gray-700">Child's Name/Nickname</label><input type="text" value={child.name} onChange={e => handleChildChange(index, 'name', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#6d0b0b] focus:border-[#6d0b0b]"/></div>
                                    <div><label className="block text-sm font-medium text-gray-700">Child's Date of Birth</label><input type="date" max={today} value={child.dob} onChange={e => handleChildChange(index, 'dob', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#6d0b0b] focus:border-[#6d0b0b]"/></div>
                                    <div><label className="block text-sm font-medium text-gray-700">Child's Gender</label><select value={child.gender} onChange={e => handleChildChange(index, 'gender', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#6d0b0b] focus:border-[#6d0b0b]"><option value="">Select...</option><option value="male">Male</option><option value="female">Female</option><option value="prefer_not_to_say">Prefer not to say</option></select></div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddChild} className="font-semibold" style={{color: brandColor}}>+ Add another child</button>
                        </div>
                    )}
                    {role === 'expecting' && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-4">Congratulations! When are you due?</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700">Month</label><select value={dueDate.month} onChange={e => setDueDate({...dueDate, month: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#6d0b0b] focus:border-[#6d0b0b]"><option value="">Select Month</option>{months.map((month, i) => (<option key={month} value={i+1} disabled={dueDate.year == currentYear && i+1 < currentMonth}>{month}</option>))}</select></div>
                                <div><label className="block text-sm font-medium text-gray-700">Year</label><select value={dueDate.year} onChange={e => setDueDate({...dueDate, year: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#6d0b0b] focus:border-[#6d0b0b]"><option value="">Select Year</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></div>
                            </div>
                        </div>
                    )}
                    <div className="mb-6"><label htmlFor="referral" className="block text-lg font-semibold text-gray-700">How did you hear about us? (Required)</label><select id="referral" value={referral} onChange={e => setReferral(e.target.value)} required className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#6d0b0b] focus:border-[#6d0b0b] p-2"><option value="">Select an option...</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="google">Google Search</option><option value="friend_family">Referred by friend or family</option><option value="other">Other</option></select></div>
                    <div className="flex justify-end"><button type="submit" disabled={loading} style={{ backgroundColor: brandColor }} className="text-white py-2 px-6 rounded-md hover:bg-[#5a0909] disabled:bg-gray-400 transition">{loading ? 'Saving...' : 'Finish & Enter Circle'}</button></div>
                </form>
            )}
        </div>
    );
}

function CommunityFeed({ navigateTo, user }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setLoading(true); return; }
        const q = query(collection(db, 'questions'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const questionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            questionsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setQuestions(questionsData); setLoading(false);
        }, (error) => { console.error("Firestore permission error in CommunityFeed:", error); setLoading(false); });
        return () => unsubscribe();
    }, [user]);

    if (loading) return <LoadingScreen text="Loading the Circle..." />;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Community Circle</h1>
            <div className="bg-white rounded-lg shadow"><ul className="divide-y divide-gray-200">
                {questions.map(q => (
                    <li key={q.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => navigateTo('question', q.id)}>
                        <h2 className="font-semibold text-lg text-gray-800 hover:text-[#6d0b0b]">{q.title}</h2>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{q.content}</p>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                            <span>Asked by @{q.authorUsername}</span><span>{q.answerCount || 0} answers</span>
                        </div>
                    </li>
                ))}
            </ul></div>
        </div>
    );
}

function QuestionDetailPage({ questionId, user, userData, navigateTo }) {
    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAnswer, setNewAnswer] = useState('');

    useEffect(() => {
        if (!user || !questionId) { setLoading(true); return; }
        const questionRef = doc(db, 'questions', questionId);
        const unsubscribeQuestion = onSnapshot(questionRef, (docSnap) => {
            if (docSnap.exists()) setQuestion({ id: docSnap.id, ...docSnap.data() });
            else console.error("Question not found");
            setLoading(false);
        }, (error) => { console.error("Firestore permission error on question:", error); setLoading(false); });
        const answersQuery = query(collection(db, `questions/${questionId}/answers`));
        const unsubscribeAnswers = onSnapshot(answersQuery, (snapshot) => {
            const answersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            answersData.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
            setAnswers(answersData);
        }, (error) => { console.error("Firestore permission error on answers:", error); });
        return () => { unsubscribeQuestion(); unsubscribeAnswers(); };
    }, [questionId, user]);

    const handleAnswerSubmit = async (e) => {
        e.preventDefault();
        if (newAnswer.trim() === '' || !user) return;
        const answerRef = collection(db, `questions/${questionId}/answers`);
        await addDoc(answerRef, { content: newAnswer, authorId: user.uid, authorUsername: userData.username, createdAt: serverTimestamp(), upvotes: [] });
        const questionRef = doc(db, 'questions', questionId);
        await updateDoc(questionRef, { answerCount: answers.length + 1 });
        setNewAnswer('');
    };

    const handleVote = async (answerId, currentUpvotes) => {
        if (!user) return;
        const answerRef = doc(db, `questions/${questionId}/answers`, answerId);
        const userId = user.uid; let newUpvotes = [...(currentUpvotes || [])];
        if (newUpvotes.includes(userId)) newUpvotes = newUpvotes.filter(uid => uid !== userId);
        else newUpvotes.push(userId);
        await updateDoc(answerRef, { upvotes: newUpvotes });
    };

    if (loading) return <LoadingScreen text="Loading question..." />;
    if (!question) return <div>Question not found. <button onClick={() => navigateTo('feed')}>Back to feed</button></div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{question.title}</h1>
            <div className="text-sm text-gray-500 mb-4">Asked by @{question.authorUsername}</div>
            <p className="text-gray-700 whitespace-pre-wrap mb-8">{question.content}</p>
            <div className="my-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{answers.length} Answers</h2>
                <div className="space-y-6">
                    {answers.map((answer, index) => (
                        <div key={answer.id} className={`bg-white p-6 rounded-lg shadow ${index === 0 && answer.upvotes?.length > 0 ? 'border-2 border-green-400' : ''}`}>
                            {index === 0 && answer.upvotes?.length > 0 && <div className="text-sm font-bold text-green-600 mb-2">BEST ANSWER</div>}
                            <p className="text-gray-800 mb-4">{answer.content}</p>
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500">Answered by @{answer.authorUsername}</div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleVote(answer.id, answer.upvotes)} className="group">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-all duration-200 ${answer.upvotes?.includes(user?.uid) ? 'text-red-500 scale-110' : 'text-gray-400 group-hover:text-red-300'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                    </button>
                                    <span className="font-bold text-gray-700">{answer.upvotes?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-10 bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-4">Your Answer</h3>
                <form onSubmit={handleAnswerSubmit}>
                    <textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md h-32 focus:ring-[#6d0b0b] focus:border-[#6d0b0b]" placeholder="Share your knowledge..."></textarea>
                    <button type="submit" style={{ backgroundColor: brandColor }} className="mt-4 text-white py-2 px-6 rounded-md hover:bg-[#5a0909]">Post Answer</button>
                </form>
            </div>
        </div>
    );
}

function AskQuestionPage({ user, userData, onComplete }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (title.trim() === '' || content.trim() === '' || !user) return;
        setLoading(true);
        try {
            const questionRef = await addDoc(collection(db, 'questions'), { title, content, authorId: user.uid, authorUsername: userData.username, createdAt: serverTimestamp(), answerCount: 0 });
            onComplete(questionRef.id);
        } catch (error) { console.error("Error posting question:", error); setLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ask a Public Question</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., How do I potty train my 2-year-old?" className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#6d0b0b] focus:border-[#6d0b0b]"/>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Include all the information someone would need to answer your question." className="w-full p-2 border border-gray-300 rounded-md h-40 focus:ring-[#6d0b0b] focus:border-[#6d0b0b]"></textarea>
                </div>
                <button type="submit" disabled={loading} style={{ backgroundColor: brandColor }} className="text-white py-2 px-6 rounded-md hover:bg-[#5a0909] disabled:bg-gray-400">
                    {loading ? 'Posting...' : 'Post Your Question'}
                </button>
            </form>
        </div>
    );
}

function ProfilePage({ user, userData, setUserData, onComplete }) {
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData) {
            setFormData({ role: userData.role || '', children: userData.children && userData.children.length > 0 ? userData.children : [{ name: '', dob: '', gender: '' }], dueDate: userData.dueDate || { month: '', year: '' }, referral: userData.referral || '' });
        }
    }, [userData]);

    if (!formData) return <LoadingScreen />;

    const handleUpdate = async (e) => {
        e.preventDefault(); setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const updatedData = { ...formData, children: formData.role === 'parent' ? formData.children.filter(c => c.name || c.dob || c.gender) : [], updatedAt: serverTimestamp() };
        try {
            await setDoc(userDocRef, updatedData, { merge: true });
            setUserData(prev => ({...prev, ...updatedData}));
            alert("Profile updated successfully!"); onComplete();
        } catch (error) { console.error("Error updating profile:", error); alert("Failed to update profile."); setLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Your Profile</h2>
            <p className="text-gray-600 mb-6">Username: <span className="font-semibold">@{userData.username}</span> (cannot be changed)</p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
                <p className="text-blue-800">We collect this info to improve your experience and share the latest offers. As a thank-you, we’ll send a special birthday gift and up to 20% off for your child — stackable with any current deals. Your trust means a lot to us!</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">A complete form to edit all your details would appear here, similar to the onboarding flow.</p>
            <button onClick={handleUpdate} disabled={loading} style={{ backgroundColor: brandColor }} className="text-white py-2 px-6 rounded-md hover:bg-[#5a0909] disabled:bg-gray-400">
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}

function LoadingScreen({ text = "Loading..." }) {
    return (
        <div className="flex items-center justify-center h-screen -mt-20">
            <div className="text-center">
                <svg className="animate-spin h-10 w-10 mx-auto" style={{color: brandColor}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg font-semibold text-gray-700">{text}</p>
            </div>
        </div>
    );
}