import React, { useState, useEffect } from 'react'
import SignIn from './components/SignIn'
import Dashboard from './components/Dashboard'

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme')
        if (saved) return saved === 'dark'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
        if (isDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDarkMode])

    const handleSignIn = () => {
        setIsLoggedIn(true)
    }

    const toggleDarkMode = () => setIsDarkMode(prev => !prev)

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            {isLoggedIn ? (
                <Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            ) : (
                <SignIn onSignIn={handleSignIn} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            )}
        </div>
    )
}

export default App
