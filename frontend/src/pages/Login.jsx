import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { login, signup, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
    if (isSignUp) {
      const result = await signup(email, password, name)
      if (result.success) {
        navigate('/upload')
      } else {
        setError(result.error)
      }
    } else {
      const result = await login(email, password)
      if (result.success) {
        navigate('/upload')
      } else {
        setError(result.error)
      }
    }
  }

  function handleToggleMode() {
    setIsSignUp(!isSignUp)
    setError('')
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div className="login-container">
      {/* Left Column: Brand & Animated Clinical Visuals */}
      <div className="login-visual-side">
        <div className="visual-overlay"></div>
        
        <div className="visual-header">
          <div className="logo-badge">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#2EC4B6" strokeWidth="2.5"/>
              <path d="M8 14 Q11 8 14 14 Q17 20 20 14" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="14" cy="14" r="2.5" fill="#2EC4B6"/>
            </svg>
            <span className="logo-text">PulmoSight</span>
          </div>
        </div>
        
        <div className="visual-content">
          <div className="scanner-graphic">
            <div className="grid-lines"></div>
            <div className="lung-outline">
              <svg viewBox="0 0 100 100" className="lungs-svg" width="100%" height="100%">
                {/* Clean, geometric, state-of-the-art vector lungs */}
                <path 
                  d="M 46,15 C 38,13 25,18 20,35 C 16,50 18,78 30,85 C 38,90 46,80 46,65 C 46,50 48,30 46,15 Z" 
                  fill="rgba(46, 196, 182, 0.08)" 
                  stroke="#2EC4B6" 
                  strokeWidth="1.5" 
                />
                <path 
                  d="M 54,15 C 62,13 75,18 80,35 C 84,50 82,78 70,85 C 62,90 54,80 54,65 C 54,50 52,30 54,15 Z" 
                  fill="rgba(46, 196, 182, 0.08)" 
                  stroke="#2EC4B6" 
                  strokeWidth="1.5" 
                />
                {/* Trachea and main bronchi */}
                <path 
                  d="M 50,10 L 50,22 L 44,28 M 50,22 L 56,28" 
                  fill="none" 
                  stroke="#2EC4B6" 
                  strokeWidth="1.5" 
                  strokeLinecap="round"
                />
                {/* Cancer Nodules with pulse animations */}
                <circle cx="30" cy="52" r="3.5" fill="#ef4444" className="scan-nodule-1" />
                <circle cx="68" cy="62" r="3" fill="#ef4444" className="scan-nodule-2" />
                {/* Scan laser line */}
                <line x1="12" y1="12" x2="88" y2="12" stroke="#2EC4B6" strokeWidth="1.5" className="laser-beam" />
              </svg>
            </div>
          </div>
          
          <h2 className="visual-headline">Advanced AI Lungs Cancer Diagnostic System</h2>
          <p className="visual-tagline">Providing radiologists with state-of-the-art computer-aided detection powered by deep learning segmentations.</p>
          
          <div className="features-list">
            <div className="feat-item">
              <span className="feat-icon">⚡</span>
              <div>
                <h4>YOLOv11 Nodule Detection</h4>
                <p>98.4% accuracy in detecting early-stage pulmonary nodules and lesions.</p>
              </div>
            </div>
            <div className="feat-item">
              <span className="feat-icon">🔬</span>
              <div>
                <h4>Grad-CAM Explainability</h4>
                <p>Visualizing model focus areas directly over chest scans with heatmap overlays.</p>
              </div>
            </div>
            <div className="feat-item">
              <span className="feat-icon">📄</span>
              <div>
                <h4>Radiology PDF Reports</h4>
                <p>Generate clean, compliant, and print-ready patient diagnostic summaries.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="visual-footer">
          <span>PulmoSight Platform v1.2.0 • HIPAA Compliant</span>
        </div>
      </div>
      
      {/* Right Column: Clean Interactive Clinical Form */}
      <div className="login-form-side">
        <div className="form-container">
          <div className="form-header">
            <h2>{isSignUp ? "Create Workspace" : "Welcome Back"}</h2>
            <p>{isSignUp ? "Register your radiologist credentials to get started." : "Enter your credentials to access your portal."}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="modern-form">
            {isSignUp && (
              <div className="form-field">
                <label htmlFor="name-input">Full Name</label>
                <input
                  id="name-input"
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Dr. Rajesh Sharma" required autoFocus
                />
              </div>
            )}
            <div className="form-field">
              <label htmlFor="email-input">Email Address</label>
              <input
                id="email-input"
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dr.name@hospital.com" required autoFocus={!isSignUp}
              />
            </div>
            <div className="form-field">
              <label htmlFor="password-input">Password</label>
              <input
                id="password-input"
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
              />
            </div>
            
            {error && <div className="form-error-msg">⚠️ {error}</div>}
            
            <button type="submit" className="submit-action-btn" disabled={loading}>
              {loading 
                ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                : (isSignUp ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>
          
          <div className="form-footer-switch">
            <span>{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>
            <button onClick={handleToggleMode} className="switch-trigger-btn">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
          
          <div className="legal-disclaimer">
            <span className="warn-icon">⚠️</span>
            <p><strong>Clinical Notice:</strong> This system is for the exclusive use of licensed medical professionals. All uploads are confidential under patient privacy laws.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
