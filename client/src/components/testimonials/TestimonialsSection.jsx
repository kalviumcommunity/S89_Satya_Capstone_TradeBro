import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './TestimonialsSection.css';

// Using placeholder avatars for now
const avatar1 = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';
const avatar2 = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';
const avatar3 = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
const avatar4 = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face';

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Senior Day Trader',
      avatar: avatar1,
      rating: 5,
      quote: 'TradeBro made me understand the market faster than any course! Saytrix is like having a finance mentor 24/7 who answers all my questions instantly.',
      location: 'Mumbai'
    },
    {
      name: 'Priya Sharma',
      role: 'Investment Analyst',
      avatar: avatar2,
      rating: 5,
      quote: 'The professional-grade charts and portfolio analytics rival Bloomberg Terminal. It\'s incredible that this level of sophistication is available for free.',
      location: 'Bangalore'
    },
    {
      name: 'Amit Patel',
      role: 'Retail Investor',
      avatar: avatar3,
      rating: 5,
      quote: 'Started with zero trading knowledge. TradeBro\'s gamified learning system and virtual trading made me profitable within 3 months. The AI assistant is a game-changer!',
      location: 'Delhi'
    },
    {
      name: 'Sneha Reddy',
      role: 'Portfolio Manager',
      avatar: avatar4,
      rating: 5,
      quote: 'The risk management tools and AI-powered market sentiment analysis have significantly improved my portfolio performance. Best platform for Indian stocks!',
      location: 'Hyderabad'
    }
  ];
  
  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
  
  return (
    <section className="testimonials-section">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">
            What Our Traders Say
          </h2>
          <p className="section-subtitle">
            Join thousands of successful traders who trust TradeBro
          </p>
        </motion.div>
        
        <div className="testimonials-container">
          <motion.button 
            className="testimonial-nav prev"
            onClick={prevTestimonial}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiChevronLeft size={24} />
          </motion.button>
          
          <div className="testimonials-carousel">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className={`testimonial-card ${index === activeIndex ? 'active' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: index === activeIndex ? 1 : 0,
                  scale: index === activeIndex ? 1 : 0.8,
                  x: `${(index - activeIndex) * 100}%`
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="testimonial-content">
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FiStar key={i} className="star filled" />
                    ))}
                  </div>
                  
                  <blockquote>"{testimonial.quote}"</blockquote>
                  
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      <img src={testimonial.avatar} alt={testimonial.name} />
                    </div>
                    <div className="author-info">
                      <span className="author-name">{testimonial.name}</span>
                      <span className="author-role">{testimonial.role}</span>
                      <span className="author-location">{testimonial.location}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.button 
            className="testimonial-nav next"
            onClick={nextTestimonial}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiChevronRight size={24} />
          </motion.button>
        </div>
        
        <div className="testimonial-indicators">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
