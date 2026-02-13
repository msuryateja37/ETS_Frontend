'use client';

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowLeft, Send, HelpCircle, ChevronDown, ChevronUp, Crown } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import RoleGuard from "@/app/components/RoleGuard";
import { useRouter } from "next/navigation";
import Footer from "@/app/components/Footer";

export default function ContactUsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I purchase tickets?",
      answer: "Browse events, select your preferred seats, and complete the secure checkout process. Payment is processed instantly.",
    },
    {
      id: 2,
      question: "Can I cancel my tickets?",
      answer: "Check our refund policy for each event. Some events allow full refunds up to 24 hours before the event, while others may have different terms.",
    },
    {
      id: 3,
      question: "Need help with your account?",
      answer: "Contact our support team for account-related issues. We can help with password resets, profile updates, and any other account concerns.",
    },
    {
      id: 4,
      question: "How do I get event updates?",
      answer: "Once you purchase tickets, you'll receive email updates about the event. You can also enable push notifications in your account settings.",
    }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue = name === "email" ? value.toLowerCase() : value;
    setFormData(prev => ({
      ...prev,
      [name]: normalizedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitMessage('Thank you for your message! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitMessage('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["CUSTOMER"]}>
      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 px-5 py-2.5 bg-card border-2 border-primary/30 rounded-full text-primary font-bold hover:bg-background-hover hover:border-primary transition-all shadow-lg uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back</span>
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-primary">
                <MessageCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight uppercase">
                  Contact Us
                </h1>
                <p className="text-muted-foreground font-medium mt-2 tracking-wide">
                  Get in touch with our support team
                </p>
              </div>
            </div>
          </div>

          {/* Contact Content - Single Column Layout */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Interactive FAQ Section */}
            <div className="bg-gradient-to-br from-card to-background rounded-2xl p-8 shadow-xl border-2 border-primary/20">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-6 flex items-center gap-3 uppercase tracking-wide">
                <HelpCircle className="w-7 h-7 text-primary" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border-2 border-primary/20 rounded-xl overflow-hidden bg-card-elevated hover:border-primary/40 transition-all">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-background-hover transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary-dark flex-shrink-0 shadow-lg shadow-primary/30"></span>
                        <h4 className="font-bold text-foreground tracking-wide">{faq.question}</h4>
                      </div>
                      {expandedFAQ === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-primary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-primary" />
                      )}
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-6 pb-5 ml-7 border-t border-primary/10 pt-4">
                        <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-br from-card to-background rounded-2xl p-8 shadow-xl border-2 border-primary/20">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-6 uppercase tracking-wide">
                Get in Touch
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 bg-card-elevated rounded-xl border border-primary/10 hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-background rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/30">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground uppercase text-xs tracking-wider mb-1">Email</p>
                    <p className="text-muted-foreground text-sm">support@eventticketsystem.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-card-elevated rounded-xl border border-primary/10 hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-background rounded-xl flex items-center justify-center flex-shrink-0 border border-accent/30">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground uppercase text-xs tracking-wider mb-1">Phone</p>
                    <p className="text-muted-foreground text-sm">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-card-elevated rounded-xl border border-primary/10 hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-background rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/30">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground uppercase text-xs tracking-wider mb-1">Address</p>
                    <p className="text-muted-foreground text-sm">123 Event Street, City, State 12345</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-card-elevated rounded-xl border border-primary/10 hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-background rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/30">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground uppercase text-xs tracking-wider mb-1">Business Hours</p>
                    <p className="text-muted-foreground text-sm">Mon-Fri: 9AM-6PM, Sat-Sun: 10AM-4PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gradient-to-br from-card to-background rounded-2xl p-8 shadow-xl border-2 border-primary/20">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-6 uppercase tracking-wide">
                Send us a Message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-card-elevated border-2 border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder-muted-foreground transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-card-elevated border-2 border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder-muted-foreground transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-card-elevated border-2 border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder-muted-foreground transition-all"
                    placeholder="What's this about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary uppercase tracking-wider mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-card-elevated border-2 border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none text-foreground placeholder-muted-foreground transition-all"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary disabled:from-muted disabled:to-muted-dark text-primary-foreground font-black rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
                {submitMessage && (
                  <p className="text-sm text-center text-accent font-bold">
                    {submitMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </RoleGuard>
  );
}
