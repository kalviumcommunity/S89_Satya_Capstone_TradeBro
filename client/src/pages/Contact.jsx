import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FiMail, FiUser, FiMessageSquare, FiSend, FiCheck } from "react-icons/fi";
import PageLayout from "../components/PageLayout";
import { useToast } from "../context/ToastContext";
import "../styles/pages/Contact.css";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { name, email, message } = formData;

    if (!name.trim()) {
      toast.error("Please enter your name");
      return false;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!message.trim()) {
      toast.error("Please enter your message");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/contact/send`, formData);

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
        toast.success("Message sent successfully!");

        // Reset success state after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error("Error sending message:", error);

      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to send message. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="contact-container">
        <motion.h1
          className="contact-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FiMail className="title-icon" /> Contact Us
        </motion.h1>

        <motion.div
          className="contact-content"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <p>
              Have questions about TradeBro or need assistance with your trading journey?
              Fill out the form and our team will get back to you as soon as possible.
            </p>
            <div className="contact-details">
              <div className="contact-item">
                <FiMail />
                <span>tradebro2025@gmail.com</span>
              </div>
              <div className="contact-item">
                <FiUser />
                <span>Customer Support Team</span>
              </div>
              <div className="contact-item">
                <FiMessageSquare />
                <span>We typically respond within 24 hours</span>
              </div>
            </div>
          </div>

          <motion.form
            className="contact-form glass"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="form-group">
              <label htmlFor="name">
                <FiUser /> Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                disabled={loading || success}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FiMail /> Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
                disabled={loading || success}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">
                <FiMessageSquare /> Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject (Optional)"
                disabled={loading || success}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">
                <FiMessageSquare /> Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your Message"
                rows="5"
                disabled={loading || success}
                required
              ></textarea>
            </div>

            <motion.button
              type="submit"
              className={`submit-btn ${success ? 'success' : ''}`}
              disabled={loading || success}
              whileHover={!loading && !success ? { scale: 1.05 } : {}}
              whileTap={!loading && !success ? { scale: 0.95 } : {}}
            >
              {loading ? (
                "Sending..."
              ) : success ? (
                <>
                  <FiCheck /> Message Sent
                </>
              ) : (
                <>
                  <FiSend /> Send Message
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default Contact;
