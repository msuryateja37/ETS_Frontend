"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Search, Calendar, MapPin, Heart, ChevronRight, ChevronLeft, Ticket, Sparkles, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from "../components/Navbar";
import { formatLikes } from "../utils/formatLikes";
import Footer from "../components/Footer";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "../utils/dateUtils";

import { useCustomerEvents, useCustomerProfile, useToggleLike } from "../../hooks/useCustomer";

export default function CustomerHomePage({ logout }) {
  const { user, token } = useAuth();
  const router = useRouter();

  const { data: allEvents = [], isLoading: eventsLoading, isError: eventsError, error: eventsFetchError } = useCustomerEvents(user?.role);
  const { data: customerData, isLoading: customerLoading } = useCustomerProfile(user?._id);
  const toggleLikeMutation = useToggleLike();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselImagesLoaded, setCarouselImagesLoaded] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  const categories = ['ALL', 'MUSIC', 'SPORTS', 'COMEDY', 'CASINO', 'THEATER'];
  const autoRotateRef = useRef(null);

  const customerId = customerData?._id;
  const likedEvents = useMemo(() => new Set(customerData?.likedEvents?.map(id => id.toString()) || []), [customerData]);

  const featuredEvents = useMemo(() => allEvents.slice(0, 5), [allEvents]);

  // Preload carousel images
  useEffect(() => {
    featuredEvents.forEach((event) => {
      if (!carouselImagesLoaded.has(event._id)) {
        const img = new Image();
        img.src = getEventImage(event);
        img.onload = () => {
          setCarouselImagesLoaded(prev => new Set([...prev, event._id]));
        };
      }
    });
  }, [featuredEvents]);

  const handleLikeToggle = async (eventId, e) => {
    e.stopPropagation();

    if (!user) {
      alert('Please login to like events');
      return;
    }

    if (!customerId) {
      alert('Customer data not loaded. Please try again.');
      return;
    }

    try {
      const isLiked = likedEvents.has(eventId);
      await toggleLikeMutation.mutateAsync({ customerId, eventId, isLiked });
    } catch (err) {
      console.error('Error toggling like:', err);
      alert(err.message || 'Failed to update like status');
    }
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let filtered = allEvents.filter(event => {
      const isDraft = event.status === 'DRAFT';
      const isCancelled = event.status === 'CANCELLED';
      const isOver = new Date(event.endDateTime) < now;
      return !isDraft && !isCancelled && !isOver;
    });

    // Sort by start date (ascending)
    filtered.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

    if (activeCategory !== 'ALL') {
      filtered = filtered.filter(event =>
        event.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        (event.venueId?.name || event.venue?.name || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeCategory, searchQuery, allEvents]);

  // const handleSearch = () => {
  //   // The memoized filtering already handles this when searchQuery changes
  // };

  const handleCategoryFilter = (category) => {
    setActiveCategory(category);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  const resetAutoRotate = () => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    autoRotateRef.current = setInterval(() => {
      scrollToNext();
    }, 5000);
  };

  const scrollToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev - 1 + featuredEvents.length) % featuredEvents.length);
    setTimeout(() => setIsTransitioning(false), 500);
    resetAutoRotate();
  };

  const scrollToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => (prev + 1) % featuredEvents.length);
    setTimeout(() => setIsTransitioning(false), 500);
    resetAutoRotate();
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
    resetAutoRotate();
  };

  const getEventImage = (event) => {
    if (!event) return '/placeholder.png';

    const imageUrl =
      event.landscapeImage ||
      event.portraitImage ||
      (event.images && event.images.landscape);

    if (imageUrl) {
      return imageUrl;
    }

    return `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
  };

  const groupedEvents = useMemo(() => {
    return categories.slice(1).reduce((acc, category) => {
      const categoryEvents = allEvents.filter(event =>
        (event.category?.toLowerCase() === category.toLowerCase()) ||
        (event.category?.toLowerCase() === category.toLowerCase())
      );
      if (categoryEvents.length > 0) {
        acc[category] = categoryEvents;
      }
      return acc;
    }, {});
  }, [allEvents, categories]);

  const shouldShowCarousel = !searchQuery.trim() && activeCategory === 'ALL';

  // Auto-rotation effect
  useEffect(() => {
    if (shouldShowCarousel && featuredEvents.length > 1) {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);

      autoRotateRef.current = setInterval(() => {
        scrollToNext();
      }, 5000);
    }

    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [shouldShowCarousel, featuredEvents.length]);

  if (eventsLoading && allEvents.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-semibold tracking-wide">Loading Events...</p>
        </div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md bg-gradient-to-br from-card to-background p-8 rounded-2xl shadow-2xl border border-primary/30">
          <div className="bg-destructive/30 border border-destructive/50 text-destructive-foreground px-6 py-4 rounded-xl mb-6">
            <p className="font-bold mb-1">Unable to Load Events</p>
            <p className="text-sm">{eventsFetchError?.message}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground font-bold rounded-xl hover:from-primary-light hover:to-primary transition-all shadow-lg shadow-primary/30"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        showSearch={true}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      // onSearch={handleSearch}
      />

      {/* Category Filter */}
      <div className="bg-background sticky top-20 z-40 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 overflow-x-auto scrollbar-hide p-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`flex-none px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 transform uppercase tracking-wider ${activeCategory === category
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 border border-primary'
                  : 'bg-card text-primary hover:bg-background-hover border border-primary/30'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 overflow-hidden">
        {/* Featured Carousel */}
        {shouldShowCarousel && featuredEvents.length > 0 && (
          <section className="relative w-full h-[500px] mx-auto py-4 overflow-visible my-4">
            {/* Loading Placeholder */}
            {carouselImagesLoaded.size === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Crown className="w-16 h-16 text-primary/30 animate-pulse mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Loading featured events...</p>
                </div>
              </div>
            )}

            <div className={`relative w-full h-full flex items-center justify-center transition-opacity duration-300 ${carouselImagesLoaded.size > 0 ? 'opacity-100' : 'opacity-0'}`}>
              {featuredEvents.map((event, index) => {
                const length = featuredEvents.length;

                let offset = index - currentSlide;
                while (offset > length / 2) offset -= length;
                while (offset < -length / 2) offset += length;

                const absOffset = Math.abs(offset);
                const isActive = offset === 0;
                const isLeft = offset < 0;
                const isLoaded = carouselImagesLoaded.has(event._id);

                let zIndex = 30 - absOffset * 5;

                let translateX = 0;
                let scale = 1;
                let opacity = 1;

                if (isActive) {
                  translateX = 0;
                  scale = 1.15;
                } else if (absOffset === 1) {
                  translateX = isLeft ? -40 : 40;
                  scale = 0.85;
                } else {
                  translateX = isLeft ? -60 : 60;
                  scale = 0.7;
                }

                return (
                  <div
                    key={event._id}
                    onClick={() => {
                      if (isTransitioning) return;
                      if (isActive) handleEventClick(event._id);
                      else if (offset < 0) scrollToPrevious();
                      else if (offset > 0) scrollToNext();
                    }}
                    style={{
                      zIndex: zIndex,
                    }}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-full transition-all duration-500 ease-out cursor-pointer ${!isActive ? 'pointer-events-auto' : ''}`}
                  >
                    <div
                      style={{
                        transform: `translateX(${translateX}%) scale(${scale})`,
                        opacity: opacity,
                      }}
                      className={`relative w-full h-full rounded-xl overflow-hidden transition-all duration-500 ease-out ${isActive && isLoaded
                        ? 'shadow-[0_0_60px_hsl(var(--primary)/0.4)] border-2 border-primary'
                        : isLoaded
                          ? 'shadow-lg border-2 border-primary/20'
                          : 'border-2 border-transparent'
                        }`}
                    >
                      <div className="relative w-full h-full">
                        {/* Loading skeleton */}
                        {!isLoaded && (
                          <div className="absolute inset-0 bg-card animate-pulse flex items-center justify-center">
                            <Crown className="w-12 h-12 text-primary/20" />
                          </div>
                        )}

                        <img
                          src={getEventImage(event)}
                          alt={event.name}
                          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80&auto=format&fit=crop';
                            setCarouselImagesLoaded(prev => new Set([...prev, event._id]));
                          }}
                        />

                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent transition-opacity duration-500 ${isActive ? 'opacity-90' : 'opacity-60'}`}
                        />

                        <div className={`absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>

                        <div className={`absolute inset-0 p-6 flex flex-col justify-end transition-all duration-300 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                          <div className="mb-2">
                            <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider rounded-sm">
                              {event.category || event.category || 'Event'}
                            </span>
                          </div>

                          <h3 className="text-foreground text-3xl md:text-4xl font-black leading-[0.9] mb-4 uppercase italic">
                            {event.name}
                          </h3>

                          <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground">
                            {event.startDateTime && (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-primary" />
                                <span>{formatDate(event.startDateTime, { month: 'short', day: 'numeric', year: undefined })}</span>
                              </div>
                            )}
                            {(event.venueId?.name || event.venue?.name) && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-primary" />
                                <span>{event.venueId?.name || event.venue.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {carouselImagesLoaded.size > 0 && (
              <>
                <button
                  onClick={scrollToPrevious}
                  disabled={isTransitioning}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-primary text-foreground rounded-full p-3 z-50 transition-all duration-200 shadow-lg border border-primary/30 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={scrollToNext}
                  disabled={isTransitioning}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-primary text-foreground rounded-full p-3 z-50 transition-all duration-200 shadow-lg border border-primary/30 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute -bottom-15 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
                  {featuredEvents.slice(0, 5).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      disabled={isTransitioning}
                      className={`h-2 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${currentSlide === index
                        ? 'bg-gradient-to-r from-primary to-primary-dark w-14 shadow-[0_0_25px_hsl(var(--primary)/0.8)]'
                        : 'bg-primary/40 w-2 hover:bg-primary/60 hover:w-5'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Dynamic Content Sections */}
        {
          activeCategory !== 'ALL' || searchQuery ? (
            /* Filtered Results */
            <section>
              <div className="flex items-baseline justify-between mb-8">
                <h2 className="text-3xl font-black text-primary uppercase tracking-wider">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : `${activeCategory} Events`}
                </h2>
                <span className="text-sm font-medium text-muted-foreground">
                  {filteredEvents.length} events found
                </span>
              </div>

              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      onClick={() => handleEventClick(event._id)}
                      onLike={(e) => handleLikeToggle(event._id, e)}
                      isLiked={likedEvents.has(event._id)}
                      isLiking={toggleLikeMutation.isPending && toggleLikeMutation.variables?.eventId === event._id}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </section>
          ) : (
            /* Category Sections */
            <div className="space-y-0 -mx-4 sm:-mx-6 lg:-mx-8 mt-32">
              {Object.entries(groupedEvents).map(([category, events]) => (
                <section key={category} className="w-full mb-8">
                  <div className="w-full py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex items-center justify-between mb-10">
                        <h2 className="text-4xl font-black text-primary flex items-center gap-4 uppercase tracking-tight">
                          <span className="w-1.5 h-12 bg-primary rounded-full"></span>
                          {category}
                        </h2>
                        <button
                          onClick={() => handleCategoryFilter(category)}
                          className="group flex items-center text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-dark transition-all duration-200 px-6 py-3 rounded-full shadow-lg shadow-primary/30 uppercase tracking-wider"
                        >
                          View All
                          <ChevronRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {events.slice(0, 4).map((event) => (
                          <EventCard
                            key={event._id}
                            event={event}
                            onClick={() => handleEventClick(event._id)}
                            onLike={(e) => handleLikeToggle(event._id, e)}
                            isLiked={likedEvents.has(event._id)}
                            isLiking={toggleLikeMutation.isPending && toggleLikeMutation.variables?.eventId === event._id}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ))}

              {Object.keys(groupedEvents).length === 0 && <EmptyState />}
            </div>
          )
        }
      </main >
      <Footer />
    </div >
  );
}

// Event Card Component
const EventCard = memo(({ event, onClick, onLike, isLiked, isLiking, formatDate }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const eventImageUrl = useMemo(() => {
    if (!event) return '';
    return event.landscapeImage ||
      event.portraitImage ||
      (event.images && event.images.landscape) ||
      `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&auto=format&fit=crop&q=60`;
  }, [event]);

  return (
    <div
      onClick={onClick}
      className="group bg-card-elevated rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/2] overflow-hidden bg-background">
        {/* Skeleton Shimmer */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-card animate-pulse flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary/30" />
          </div>
        )}

        <img
          src={eventImageUrl}
          alt={event.name}
          className={`w-full h-full object-cover transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300/1e293b/D4AF37?text=' + encodeURIComponent(event.name);
            setIsLoaded(true);
          }}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-200" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg border border-primary">
            {event.category || event.category || 'Event'}
          </span>

          <button
            onClick={onLike}
            disabled={isLiking}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-lg ${isLiked
              ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground border-2 border-primary'
              : 'bg-background/60 text-primary hover:text-primary-light border-2 border-primary/50'
              } ${isLiking ? 'opacity-70 cursor-wait' : 'hover:scale-110 active:scale-95'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Status Badge */}
        {event.status === 'ACTIVE' && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-accent to-accent-dark text-accent-foreground text-xs px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1.5 border border-accent">
            <span className="w-1.5 h-1.5 bg-accent-foreground rounded-full animate-pulse"></span>
            Available Now
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-card to-background">
        <h3 className="font-bold text-foreground text-lg mb-3 line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {event.name}
        </h3>

        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex items-center text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            <span>{formatDate(event.startDateTime, { month: 'short', day: 'numeric', year: undefined })}</span>
          </div>
          {(event.venueId?.name || event.venue?.name) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              <span className="line-clamp-1">{event.venueId?.name || event.venue.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-primary/20 mt-auto">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>{formatLikes(event.likes || 0)}</span>
          </div>
          <span className="text-primary text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform duration-200 uppercase tracking-wide">
            View <ChevronRight className="w-4 h-4 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
});

function EmptyState() {
  return (
    <div className="w-full py-32 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-primary/30 to-background rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-primary/30">
        <Crown className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark mb-3">No Events Found</h3>
      <p className="text-muted-foreground max-w-sm mx-auto text-sm">
        We couldn't find any events matching your criteria. Try adjusting your filters or search terms.
      </p>
    </div>
  );
}