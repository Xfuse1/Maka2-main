
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getAllHeroSlides, type HeroSlide } from "@/lib/supabase/homepage"
import { motion, AnimatePresence } from "framer-motion"

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHeroSlides() {
      try {
        const heroSlides = await getAllHeroSlides()
        setSlides(heroSlides)
      } catch (error) {
        console.error("[v0] Error fetching hero slides:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHeroSlides()
  }, [])

  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  if (loading) {
    return (
      <div className="relative w-full h-[50vh] min-h-[400px] md:h-[70vh] md:min-h-[500px] overflow-hidden bg-muted animate-pulse" />
    )
  }
  
  if (slides.length === 0) {
    return null
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] md:h-[70vh] md:min-h-[500px] overflow-hidden bg-primary">
      {/* Slides */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}
        >
            <div className="relative w-full h-full">
            <Image
              src={slides[currentSlide].image_url || "/placeholder.svg"}
              alt={slides[currentSlide].title_ar || "شريحة عرض"}
              fill
              className="object-cover object-center"
              priority={currentSlide === 0 && !!slides[currentSlide].image_url}
              loading={currentSlide === 0 ? "eager" : "lazy"}
              sizes="100vw"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/40 to-foreground/20" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <AnimatePresence>
            <motion.div
              key={currentSlide}
              className="max-w-2xl text-white"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h2 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                {slides[currentSlide].title_ar}
              </motion.h2>
              {slides[currentSlide].subtitle_ar && (
                <motion.p variants={itemVariants} className="text-xl md:text-2xl mb-4 leading-relaxed">
                  {slides[currentSlide].subtitle_ar}
                </motion.p>
              )}
              {slides[currentSlide].link_url && (
                <motion.div variants={itemVariants}>
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
                  >
                    <Link href={slides[currentSlide].link_url}>تسوق الآن</Link>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>


      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/30 backdrop-blur-sm text-foreground p-3 rounded-full transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/30 backdrop-blur-sm text-foreground p-3 rounded-full transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? "bg-background w-8" : "bg-background/50 hover:bg-background/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
