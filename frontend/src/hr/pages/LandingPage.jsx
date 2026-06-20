import {
  ArrowRight,
  Mail,
  Target,
  GitBranch,
  BarChart2,
  LogIn,
  UserPlus,
  FileText,
  Briefcase,
  Users,
  Zap,
  Award,
} from "lucide-react";
import { FaInstagram, FaLinkedin } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../styles/colors";
import logo from "../assets/logo.png";
import meetingImg from "../assets/meeting.png";
import "./LandingPage.css";

const premiumEase = [0.22, 1, 0.36, 1];

// Reusable animation variants keep the homepage motion consistent and easy to tune.
const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: premiumEase },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: premiumEase },
  },
};

const imageCardReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: premiumEase },
  },
};

const staggerGroup = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const floatingBlurCircle = (x = 24, y = -28, duration = 10) => ({
  x: [0, x, x * -0.35, 0],
  y: [0, y, y * 0.45, 0],
  scale: [1, 1.12, 0.96, 1],
  transition: {
    duration,
    repeat: Infinity,
    repeatType: "loop",
    ease: "easeInOut",
  },
});

export default function LandingPage() {
  const navigate = useNavigate();
  const onOpenLogin  = () => navigate("/login");
  const onOpenSignup = () => navigate("/register");
  const onStartTrial = () => navigate("/register-company");
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">
          <img src={logo} alt="TalentFlow Logo" className="logo-img" />
        </div>

        <div className="nav-links">
          {[
            { label: "About Us", targetId: "about-us" },
            { label: "Contact", targetId: "contact-footer" },
          ].map(({ label, targetId }) => (
            <a
              key={label}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(targetId)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="nav-link"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <button onClick={onOpenLogin} className="nav-login-btn">
  <LogIn size={18} />
  Login
</button>

<button onClick={onOpenSignup} className="nav-register-btn">
  <UserPlus size={18} />
  Register
</button>

<button onClick={onStartTrial} className="nav-trial-btn" style={{
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
  fontSize: 14, fontWeight: 700, color: "#fff",
  background: "linear-gradient(135deg,#001D39,#0A4174)",
  boxShadow: "0 8px 22px rgba(0,29,57,0.25)",
}}>
  <Briefcase size={17} />
  Start Free Trial
</button>
        </div>
      </nav>

      <section className="hero-section">
        {/* Floating gradient background accents */}
        <motion.div
          className="hero-orb orb-one pointer-events-none will-change-transform"
          animate={floatingBlurCircle(34, -38, 12)}
          style={{ animation: "none" }}
        />
        <motion.div
          className="hero-orb orb-two pointer-events-none will-change-transform"
          animate={floatingBlurCircle(-30, 32, 14)}
          style={{ animation: "none" }}
        />
        <motion.div
          className="hero-orb orb-three pointer-events-none will-change-transform"
          animate={floatingBlurCircle(18, -24, 10)}
          style={{ animation: "none" }}
        />

 <motion.div className="hero-content transform-gpu" initial="hidden" animate="visible" variants={staggerGroup}>
          <div className="hero-badge">✦ AI-Assisted Hiring Platform</div>

          {/* Hero copy fades upward on page load. */}
          <motion.h1 className="hero-title" variants={fadeUp}>
            Hire Smarter.
            <br />
            Manage Talent Better.
          </motion.h1>

          <motion.p className="hero-description" variants={fadeUp}>
            TalentFlow helps HR teams screen resumes, rank candidates, and
            manage hiring pipelines in one intelligent workspace.
          </motion.p>

          {/* CTA buttons slide up and scale gently on hover. */}
          <motion.div className="hero-buttons" variants={slideUp}>
            <motion.button onClick={onStartTrial} className="primary-btn transform-gpu" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              Start Free Trial <ArrowRight size={18} />
            </motion.button>
            <motion.button type="button" className="secondary-btn transform-gpu" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              Demo
            </motion.button>
          </motion.div>
        </motion.div>

          
      </section>

      <motion.section
        className="meeting-strip"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={imageCardReveal}
        style={{ animation: "none" }}
      >
        <img src={meetingImg} alt="Team Meeting" />
        <div>
          <h2>Built for modern hiring teams</h2>
          <p>
            Bring HR, recruiters, and hiring managers into one clear workflow.
          </p>
        </div>
      </motion.section>

      <div id="about-us">
        <div className="feature-section">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            variants={fadeUp}
          >
            Everything you need to hire at scale
          </motion.h2>

          {/* Feature cards reveal with a staggered rhythm as the section enters view. */}
          <motion.div
            className="feature-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerGroup}
          >
            {[
              {
                icon: Target,
                title: "AI Job Matching",
                desc: "Automatically match candidates to open roles with smart scoring.",
              },
              {
                icon: GitBranch,
                title: "Hiring Pipeline",
                desc: "Track every candidate from screening to offer in real time.",
              },
              {
                icon: BarChart2,
                title: "Analytics & Reports",
                desc: "Understand hiring velocity, source quality, and performance.",
              },
              {
                icon: FileText,
                title: "Resume Parser",
                desc: "Extract skills, experience, and education from resumes quickly.",
              },
            ].map((feature, index) => (
              <motion.div className="feature-card" key={index} variants={fadeUp}>
                <div className="feature-icon">
                  <feature.icon size={22} color={COLORS.deepBlue} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

       <div className="stats-section">
  <div className="stats-track">
    {[
      { value: "276", label: "Active Jobs", icon: Briefcase },
      { value: "31.3K", label: "Candidates", icon: Users },
      { value: "60%", label: "Faster Screening", icon: Zap },
      { value: "98%", label: "Client Satisfaction", icon: Award },

      { value: "276", label: "Active Jobs", icon: Briefcase },
      { value: "31.3K", label: "Candidates", icon: Users },
      { value: "60%", label: "Faster Screening", icon: Zap },
      { value: "98%", label: "Client Satisfaction", icon: Award },
    ].map((item, index) => (
      <div className="stat-box" key={`${item.label}-${index}`}>
        <div className="stat-icon">
          <item.icon size={24} />
        </div>

        <strong>{item.value}</strong>
        <span>{item.label}</span>
      </div>
    ))}
  </div>
</div>
      </div>

      <motion.div
        className="cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
      >
        <h2>Ready to transform your hiring?</h2>
        <p>Join companies already using TalentFlow to hire smarter.</p>
        <motion.button
          onClick={onStartTrial}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Free Trial
        </motion.button>
      </motion.div>

      <footer id="contact-footer" className="contact-footer">
        <div>
          <div className="footer-logo">
            <img src={logo} alt="TalentFlow Logo" />
          </div>
          <p>AI-Assisted Hiring Platform</p>
          <div className="footer-email">
            <Mail size={20} color={COLORS.deepBlue} />
            talentflow@gmail.com
          </div>
            <div className="footer-social-icons">
  <a href="#" onClick={(e) => e.preventDefault()}>
    <FaInstagram />
    <span>@talentflow</span>
  </a>

  <a href="#" onClick={(e) => e.preventDefault()}>
    <FaLinkedin />
    <span>TalentFlow</span>
  </a>
</div>
        </div>

      
      </footer>
    </div>
  );
}
