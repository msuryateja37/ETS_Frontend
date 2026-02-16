"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { formatLikes } from "../../utils/formatLikes";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Share2,
  Heart,
  Info,
  Ticket,
  Sparkles,
  Music,
  ExternalLink,
  Navigation,
  Mic2,
  Crown,
  Star
} from 'lucide-react';
import Footer from "@/app/components/Footer";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [venueDetails, setVenueDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [favoritingInProgress, setFavoritingInProgress] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (params?.id) {
      fetchEventDetails(params.id);
      if (user && token) {
        fetchCustomerData(params.id);
      }
    }
  }, [params?.id, user, token]);

  const fetchEventDetails = async (eventId) => {
    try {
      setLoading(true);
      setError(null);

      const role = user?.role || 'CUSTOMER';
      const eventRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${eventId}?role=${role}`);
      if (!eventRes.ok) return;
      const eventData = await eventRes.json();
      setEvent(eventData);

      if (eventData.venueId) {
        // venueId is now populated as an object from backend
        const venueObj = eventData.venueId;
        setVenue(venueObj);

        // Fetch extra venue details from venue-details table
        const venueId = venueObj._id;
        const venueDetailsRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URI}/venue-details/venue/${venueId}`
        );

        if (venueDetailsRes.ok) {
          const vDetailsData = await venueDetailsRes.json();
          setVenueDetails(vDetailsData);
        }
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async (eventId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Unauthorized access to customer data - session may have expired');
          return;
        }
        if (response.status === 404) return;
        throw new Error('Failed to fetch customer data');
      }

      const customerData = await response.json();
      setCustomerId(customerData._id);

      const liked = customerData.likedEvents?.some(id => id.toString() === eventId);
      setIsLiked(liked);

      const favorited = customerData.Favorites?.some(id => id.toString() === eventId);
      setIsFavorited(favorited);
    } catch (err) {
      console.error('Error fetching customer data:', err);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!customerId || favoritingInProgress) return;

    try {
      setFavoritingInProgress(true);
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/${customerId}/favorite-event`;
      const method = isFavorited ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: event._id })
      });

      if (!response.ok) throw new Error('Failed to update favorite status');

      setIsFavorited(!isFavorited);

    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setFavoritingInProgress(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!customerId || likingInProgress) return;

    try {
      setLikingInProgress(true);
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/${customerId}/like-event`;
      const method = isLiked ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: event._id })
      });

      if (!response.ok) throw new Error('Failed to update like status');

      setIsLiked(!isLiked);
      setEvent(prev => ({
        ...prev,
        likes: (prev.likes || 0) + (isLiked ? -1 : 1)
      }));

    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLikingInProgress(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const getMapUrl = (venueData) => {
    if (!venueData) return '';
    const query = encodeURIComponent(`${venueData.name}, ${venueData.address || venueData.location || venueData.city || ''}`);
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const getDirectMapLink = (venueData) => {
    if (venueData?.mapLink) return venueData.mapLink;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((venueData?.name || '') + ' ' + (venueData?.location || ''))}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-gradient-to-br from-card to-background p-8 rounded-2xl border-2 border-primary/20 shadow-xl">
          <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black text-foreground mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'This event could not be loaded'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-xl hover:from-primary-light hover:to-primary transition-all font-bold shadow-lg shadow-primary/30"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[700px] w-full overflow-hidden bg-background">
        <div className="absolute inset-0">
          <img
            src={event.landscapeImage || event.portraitImage}
            alt={event.name}
            className="w-full h-full object-cover opacity-40"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/1920x1080/000000/D4AF37?text=Event+Image';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16">
          <button
            onClick={() => router.back()}
            className="absolute group flex items-center gap-2 top-6 left-4 sm:left-8 px-5 py-2.5 bg-card border-2 border-primary/30 rounded-full text-primary font-bold hover:bg-background-hover hover:border-primary transition-all shadow-lg uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-1.5 bg-gradient-to-r from-primary/20 to-primary-dark/20 text-primary border-2 border-primary/40 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-sm shadow-lg shadow-primary/10">
                  {event.category || event.category || 'Event'}
                </span>
                {event.status === 'ACTIVE' && (
                  <span className="flex items-center gap-2 text-accent-foreground text-xs font-black px-4 py-1.5 bg-gradient-to-r from-accent/20 to-accent-dark/20 border-2 border-accent/40 rounded-full shadow-lg shadow-accent/10 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Booking Open
                  </span>
                )}
                <div className="absolute top-6 right-4 sm:right-8 z-20 flex items-center gap-2 bg-card/60 backdrop-blur-md px-5 py-3 rounded-full border-2 border-primary/30 shadow-lg shadow-primary/20">
                  <Heart className="w-5 h-5 fill-primary text-primary" />
                  <span className="text-white font-bold">{formatLikes(event.likes || 0)}</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-primary leading-tight tracking-tight uppercase">
                {event.name}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm sm:text-base">
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-bold">{formatDate(event.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-bold">{formatTime(event.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-primary/10">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-bold">{venue?.name || 'TBA'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <>
                  <button
                    onClick={handleLikeToggle}
                    disabled={likingInProgress}
                    className={`group p-4 rounded-full backdrop-blur-md border-2 transition-all duration-300 shadow-lg ${isLiked
                      ? 'bg-gradient-to-r from-primary/20 to-primary-dark/20 border-primary text-primary shadow-primary/30'
                      : 'bg-card/60 border-primary/30 text-primary hover:bg-card hover:border-primary shadow-primary/10'
                      }`}
                    title={isLiked ? "Unlike event" : "Like event"}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={handleFavoriteToggle}
                    disabled={favoritingInProgress}
                    className={`group p-4 rounded-full backdrop-blur-md border-2 transition-all duration-300 shadow-lg ${isFavorited
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500 text-yellow-500 shadow-yellow-500/30'
                      : 'bg-card/60 border-primary/30 text-primary hover:bg-card hover:border-primary shadow-primary/10'
                      }`}
                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.name,
                      text: event.description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied!');
                  }
                }}
                className="p-4 rounded-full bg-card/60 hover:bg-card backdrop-blur-md border-2 border-primary/30 hover:border-primary text-primary transition-all shadow-lg shadow-primary/10"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* About Section */}
            <div className="bg-gradient-to-br from-card to-background rounded-2xl p-8 shadow-xl border-2 border-primary/20">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-6 flex items-center gap-3 uppercase tracking-wide">
                <Info className="w-6 h-6 text-primary" />
                About the Event
              </h3>
              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed text-justify mb-8">
                {event.description || 'No description available.'}
              </div>

              {event.eventContactDetails && (
                <div className="mt-8 pt-8 border-t border-primary/10">
                  <h4 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Event Coordinator
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-card-elevated rounded-xl border border-primary/10">
                      <div className="text-muted-foreground mb-1">Name</div>
                      <div className="font-bold text-foreground">{event.eventContactDetails.coordinatorName}</div>
                    </div>
                    <div className="p-4 bg-card-elevated rounded-xl border border-primary/10">
                      <div className="text-muted-foreground mb-1">Contact</div>
                      <div className="font-bold text-foreground">
                        {event.eventContactDetails.coordinatorPhone}
                        {event.eventContactDetails.coordinatorEmail && ` • ${event.eventContactDetails.coordinatorEmail}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Artists Section */}
            {event.artists && event.artists.length > 0 && (
              <div className="bg-gradient-to-br from-card to-background rounded-2xl p-8 shadow-xl border-2 border-primary/20">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-6 flex items-center gap-3 uppercase tracking-wide">
                  <Mic2 className="w-6 h-6 text-primary" />
                  Performing Artists
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {event.artists.map((artist, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-card-elevated rounded-xl border-2 border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-primary/10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                        <span className="text-primary font-black text-lg">{artist.charAt(0)}</span>
                      </div>
                      <span className="font-bold text-foreground truncate">{artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Section */}
            {venue && (
              <div className="bg-gradient-to-br from-card to-background rounded-2xl p-8 shadow-xl border-2 border-primary/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light flex items-center gap-3 uppercase tracking-wide">
                    <Navigation className="w-6 h-6 text-primary" />
                    Location & Venue
                  </h3>
                  <a
                    href={venueDetails?.mapLink || getDirectMapLink(venue)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-primary hover:text-primary-light flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/30 hover:border-primary transition-all uppercase tracking-wider"
                  >
                    Get Directions <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="rounded-xl overflow-hidden border-2 border-primary/20 bg-card-elevated h-[300px] sm:h-[400px] relative group">
                  <iframe
                    title="Venue Location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={venueDetails?.mapLink && venueDetails.mapLink.includes('google.com/maps/embed')
                      ? venueDetails.mapLink
                      : getMapUrl(venue)}
                    allowFullScreen
                    className="grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
                  ></iframe>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 bg-card-elevated rounded-xl border-2 border-primary/10">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-black text-foreground text-lg uppercase tracking-wide">{venue.name}</div>
                      <div className="text-sm text-muted-foreground font-medium mt-1">
                        {venueDetails ? (
                          <>
                            {venueDetails.address?.street}, {venueDetails.city}<br />
                            {venueDetails.province}, {venueDetails.address?.pincode}
                          </>
                        ) : (
                          `${venue.location || ''}, ${venue.city}`
                        )}
                      </div>
                    </div>
                  </div>

                  {venueDetails && (
                    <div className="flex items-start gap-4 p-4 bg-card-elevated rounded-xl border-2 border-primary/10">
                      <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-black text-foreground text-lg uppercase tracking-wide">Venue Contact</div>
                        <div className="text-sm text-muted-foreground font-medium mt-1">
                          Phone: {venueDetails.contactPhn}<br />
                          Hours: {venueDetails.contactTimings}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">

            {/* Ticket Card - Sticky */}
            <div className="bg-gradient-to-br from-card to-background rounded-2xl p-8 shadow-2xl border-2 border-primary/30 lg:sticky lg:top-24">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Ticket className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light uppercase tracking-wide">
                    Tickets & Pricing
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium">Select a category to view seats</p>
              </div>

              {event.zones && event.zones.length > 0 ? (
                <div className="space-y-3 mb-8">
                  {event.zones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-card-elevated border-2 border-primary/10 hover:border-primary/30 transition-all group">
                      <span className="text-foreground font-bold uppercase tracking-wide text-sm">{zone.name}</span>
                      <span className="text-primary font-black text-lg">R{zone.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-card-elevated rounded-xl text-center text-muted-foreground text-sm mb-8 border-2 border-primary/10 font-medium">
                  Pricing details available at booking
                </div>
              )}

              {(() => {
                const now = new Date();
                const isOver = event.endDateTime && new Date(event.endDateTime) < now;

                return (
                  <button
                    onClick={() => {
                      if (isOver) return;
                      if (user) {
                        router.push(`/events/${event._id}/seating`);
                      } else {
                        router.push('/auth/login');
                      }
                    }}
                    disabled={isOver}
                    className={`w-full py-4 font-black rounded-xl shadow-lg transition-all transform flex items-center justify-center gap-3 uppercase tracking-wider text-sm border-2 ${isOver
                      ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-primary-foreground border-primary hover:scale-[1.02] active:scale-[0.98] shadow-primary/30 hover:cursor-pointer'
                      }`}
                  >
                    <Ticket className="w-5 h-5" />
                    {isOver ? 'Booking Closed' : 'Book Tickets Now'}
                  </button>
                );
              })()}

              <div className="mt-8 pt-8 border-t-2 border-primary/10 space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground p-4 bg-card-elevated rounded-xl border border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold">{event.seatingType || 'Standard'} Seating</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground p-4 bg-card-elevated rounded-xl border border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold">Age Requirement: {event.ageLimit || 'All Ages'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}