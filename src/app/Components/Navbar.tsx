"use client"
import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../../public/navbarlogo/lovosis-logo.png';
import iso from '../../../public/navbarlogo/iso.png';
import ce from '../../../public/navbarlogo/CE.png';
// import worlddidac from '../../../public/navbarlogo/wda.png';
import si from '../../../public/navbarlogo/SI.png';
import sk from '../../../public/navbarlogo/SK.png';
import zed from '../../../public/navbarlogo/zed.png';
import gmp from '../../../public/navbarlogo/gmp.png';
// Interfaces remain the same
interface Product {
  id: string;
  name: string;
  slug: string;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  products: Product[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  subCategories: SubCategory[];
}

interface NavbarCategory {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [navbarCategories, setNavbarCategories] = useState<NavbarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNavbarCategory, setExpandedNavbarCategory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isTopVisible, setIsTopVisible] = useState(true);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);

  // Memoized search handler with debouncing
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.trim().length === 0) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        setIsSearching(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300),
    []
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Memoized data fetching
  const fetchData = useCallback(async () => {
    try {
      // Fetch all three endpoints in parallel
      const [navbarResponse, categoriesResponse, subcategoriesResponse] = await Promise.all([
        fetch('/api/navbarcategories'),
        fetch('/api/categories'),
        fetch('/api/subcategories')
      ]);

      const [navbarData, categoriesData, subcategoriesData] = await Promise.all([
        navbarResponse.json(),
        categoriesResponse.json(),
        subcategoriesResponse.json()
      ]);

      // Combine the data into a hierarchical structure
      const formattedData = navbarData.map((navbarCategory: any) => ({
        id: navbarCategory._id || '',
        name: navbarCategory.name || '',
        slug: navbarCategory.slug || '',
        categories: categoriesData
          .filter((category: any) => category.navbarCategoryId === navbarCategory._id)
          .map((category: any) => ({
            id: category._id || '',
            name: category.name || '',
            slug: category.slug || '',
            subCategories: subcategoriesData
              .filter((subcategory: any) => subcategory.categoryId === category._id)
              .map((subcategory: any) => ({
                id: subcategory._id || '',
                name: subcategory.name || '',
                slug: subcategory.slug || '',
                products: []
              }))
          }))
      }));

      setNavbarCategories(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setNavbarCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Updated scroll handler
  const handleScroll = useCallback(() => {
    let isScrollingTimeout: NodeJS.Timeout | null = null;
    const currentScrollY = window.scrollY;
    const scrollThreshold = 50;

    if (Math.abs(currentScrollY - scrollPosition) > 5) {
      if (isScrollingTimeout) {
        clearTimeout(isScrollingTimeout);
      }

      if (!isTopVisible && currentScrollY < scrollThreshold) {
        setIsTopVisible(true);
      } else if (isTopVisible && currentScrollY >= scrollThreshold) {
        setIsTopVisible(false);
      }

      setScrollPosition(currentScrollY);

      isScrollingTimeout = setTimeout(() => {
        setScrollPosition(currentScrollY);
      }, 100);
    }
  }, [scrollPosition, isTopVisible]);

  // Replace the scroll event listener useEffect
  useEffect(() => {
    let scrollTimer: number;

    const throttledScroll = () => {
      if (!scrollTimer) {
        scrollTimer = window.setTimeout(() => {
          handleScroll();
          scrollTimer = 0;
        }, 150); // Increased debounce time
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, [handleScroll]);

  // Memoized click handlers
  const handleNavbarCategoryClick = useCallback((navbarCategoryId: string) => {
    setExpandedNavbarCategory(expandedNavbarCategory === navbarCategoryId ? null : navbarCategoryId);
    setExpandedCategory(null);
  }, [expandedNavbarCategory]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  }, [expandedCategory]);

  const handleLinkClick = useCallback(() => {
    setIsMegaMenuOpen(false);
    setExpandedNavbarCategory(null);
    setExpandedCategory(null);
    setIsOpen(false);
  }, []);

  // Effect hooks
  useEffect(() => {
    fetchData();

    // Set active section based on current path
    const path = window.location.pathname;
    const section = path.split('/')[1];
    setActiveSection(section || 'home');
  }, [fetchData]);

  // Handle click outside to close mega menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const megaMenu = document.getElementById('mega-menu');
      const megaMenuButton = document.getElementById('mega-menu-button');
      const servicesDropdown = document.querySelector('[data-services-dropdown]');

      if (megaMenu && megaMenuButton) {
        if (!megaMenu.contains(event.target as Node) &&
          !megaMenuButton.contains(event.target as Node)) {
          setIsMegaMenuOpen(false);
          setExpandedNavbarCategory(null);
          setExpandedCategory(null);
        }
      }

      if (servicesDropdown && !servicesDropdown.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    console.log("Toggling menu. Current state:", isOpen);
    setIsOpen(!isOpen);
  };

  const toggleMegaMenu = () => {
    setIsMegaMenuOpen(!isMegaMenuOpen);
    if (!isMegaMenuOpen) {
      setExpandedNavbarCategory(null);
      setExpandedCategory(null);
    }
  };

  const toggleSearchBar = () => {
    setIsSearchBarVisible(!isSearchBarVisible);
  };

  return (
    <nav className="bg-gradient-to-r from-white via-gray-50 to-white text-black sticky top-0 z-50 shadow-lg">
      {/* Top bar with logo and certifications */}
      <div
        className={`bg-gradient-to-r from-gray-50 via-white to-gray-50 py-3 px-4 sm:px-6 lg:px-8 border-b border-gray-100 transition-all duration-300 ease-in-out ${isTopVisible ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'
          }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src={logo.src}
                alt="Lovosis Logo"
                width={350}
                height={450}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Certification Badges - Updated styling */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Google 360° - Enhanced */}
            <Link href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="group relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-200 cursor-pointer">
                360°
              </div>
            </Link>

            {/* Updated certification badges */}
            {/*
              { src: iso.src, alt: "ISO" },
              { src: ce.src, alt: "CE" },
              { src: si.src, alt: "SI" },
              { src: sk.src, alt: "SK" },
              { src: zed.src, alt: "ZED" },
              { src: gmp.src, alt: "GMP" }
            */}
            <div className="group relative">
              <Image
                src={iso.src}
                alt="ISO"
                width={48}
                height={48}
                className="rounded-xl transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-100 cursor-pointer"
              />
            </div>

            <div className="group relative">
              <Image
                src={ce.src}
                alt="CE"
                width={48}
                height={48}
                className="rounded-xl transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-100 cursor-pointer"
              />
            </div>

            <div className="group relative">
              <Image
                src={si.src}
                alt="SI"
                width={48}
                height={48}
                className="rounded-xl transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-100 cursor-pointer"
              />
            </div>

            <div className="group relative">
              <Image
                src={sk.src}
                alt="SK"
                width={48}
                height={48}
                className="rounded-xl transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-100 cursor-pointer"
              />
            </div>

            <div className="group relative">
              <Image
                src={zed.src}
                alt="ZED"
                width={48}
                height={48}
                className="rounded-xl transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-100 cursor-pointer"
              />
            </div>

            <div className="group relative">
              <Image
                src={gmp.src}
                alt="GMP"
                width={48}
                height={48}
                className="rounded-xl transform transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-100 cursor-pointer"
              />
            </div>
          </div>

          {/* <div className="hidden md:flex items-center space-x-4">
            <div className="group relative">
              <Image
                src={worlddidac.src}
                alt="Worlddidac"
                width={100}
                height={100}
                className="rounded-full transform transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
              />
            </div>
          </div> */}

          {/* Contact Info - Enhanced */}
          <div className="hidden md:flex flex-col items-end">
            {/* Update contact info styling */}
            {/*
              { icon: "phone", href: "tel:+917012970281", text: "+91 7012970281" },
              { icon: "email", href: "mailto:info@lovosis.com", text: "info@lovosis.com" },
              { icon: "phone", href: "tel:+919747745544", text: "+91 9747745544" },
              { icon: "email", href: "mailto:lovosist@gmail.com", text: "lovosist@gmail.com" }
            */}
            <div className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-200 mb-1 last:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:+917012970281" className="text-sm hover:underline">+91 7012970281</a>
            </div>
            <div className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-200 mb-1 last:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:info@lovosis.com" className="text-sm hover:underline">info@lovosis.com</a>
            </div>
            <div className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-200 mb-1 last:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:+919747745544" className="text-sm hover:underline">+91 9747745544</a>
            </div>
            <div className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-200 mb-1 last:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:lovosist@gmail.com" className="text-sm hover:underline">lovosist@gmail.com</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - Enhanced */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out ${!isTopVisible ? 'shadow-md' : ''
        }`}>
        <div className="flex justify-between items-center h-16">
          {/* Logo - Shows when top section is hidden */}
          <div className={`${!isTopVisible ? 'opacity-100 w-auto' : 'opacity-0 w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
            <Link href="/" className="flex items-center">
              <Image
                src={logo.src}
                alt="Lovosis Logo"
                width={120}
                height={30}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Main Menu Items */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide ${activeSection === 'home' ? 'bg-white text-black' : 'text-gray-800 hover:bg-gray-100'} transition-all duration-300`}
            >
              Home
            </Link>

            <Link
              href="/about"
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide ${activeSection === 'about' ? 'bg-white text-indigo-800' : 'text-gray-800 hover:bg-gray-100'} transition-all duration-300`}
            >
              About
            </Link>

            {/* Services Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide flex items-center gap-2 ${activeSection === 'services' ? 'bg-white text-indigo-800' : 'text-gray-800 hover:bg-gray-100'} transition-all duration-300`}
              >
                Services
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Services Dropdown Menu */}
              {isServicesOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <Link
                    href="/services/electronics-manufacturing"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsServicesOpen(false)}
                  >
                    Electronics Manufacturing
                  </Link>
                  <Link
                    href="/services/it-services"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsServicesOpen(false)}
                  >
                    IT Services
                  </Link>
                </div>
              )}
            </div>

            {/* Products Mega Menu Button */}
            <div className="relative">
              <button
                id="mega-menu-button"
                onClick={toggleMegaMenu}
                className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide flex items-center gap-2 ${activeSection === 'products' ? 'bg-white text-black' : 'bg-white text-black'} transition-all duration-300`}
              >
                Products
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="black"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mega Menu Redesigned */}
              {isMegaMenuOpen && (
                <div
                  id="mega-menu"
                  className="absolute left-1/2 transform -translate-x-1/2 mt-4 w-[900px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out z-50"
                >
                  <div className="flex">
                    {/* Left sidebar */}
                    <div className="w-64 bg-white p-6 border-r border-gray-200">
                      <h3 className="text-black text-lg font-semibold mb-6">Product Groups</h3>

                      {loading ? (
                        <div className="flex items-center justify-center h-40">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
                        </div>
                      ) : navbarCategories.length > 0 ? (
                        <div className="space-y-2">
                          {navbarCategories.map((navbarCategory) => (
                            <div
                              key={navbarCategory.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${expandedNavbarCategory === navbarCategory.id
                                ? 'bg-gray-100 text-black'
                                : 'text-black hover:bg-gray-100'
                                } transition-all duration-200`}
                            >
                              <Link
                                href={`/products/${navbarCategory.slug}`}
                                className="text-sm font-medium cursor-pointer flex-1"
                                onClick={handleLinkClick}
                              >
                                {navbarCategory.name}
                              </Link>
                              <svg
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleNavbarCategoryClick(navbarCategory.id);
                                }}
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 cursor-pointer transition-transform ${expandedNavbarCategory === navbarCategory.id ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="black"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-8">
                          No categories available
                        </div>
                      )}
                    </div>

                    {/* Right content area */}
                    <div className="flex-1 p-6">
                      {expandedNavbarCategory ? (
                        <div className="grid grid-cols-2 gap-6">
                          {/* Categories */}
                          <div>
                            <h3 className="text-black text-sm font-semibold uppercase tracking-wider mb-4">Categories</h3>
                            <div className="grid grid-cols-1 gap-2">
                              {navbarCategories
                                .find(nc => nc.id === expandedNavbarCategory)
                                ?.categories.map((category) => (
                                  <div
                                    key={category.id}
                                    className={`p-3 rounded-lg ${expandedCategory === category.id
                                      ? 'bg-gray-100 text-black'
                                      : 'text-black hover:bg-gray-100'
                                      } transition-all duration-200`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <Link
                                        href={`/products/${navbarCategories.find(nc => nc.id === expandedNavbarCategory)?.slug}/${category.slug}`}
                                        className="text-sm font-medium cursor-pointer flex-1"
                                        onClick={handleLinkClick}
                                      >
                                        {category.name}
                                      </Link>
                                      <svg
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleCategoryClick(category.id);
                                        }}
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-4 w-4 cursor-pointer transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="black"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Subcategories */}
                          <div>
                            {expandedCategory && (
                              <>
                                <h3 className="text-black text-sm font-semibold uppercase tracking-wider mb-4">Sub Categories</h3>
                                <div className="grid grid-cols-1 gap-2">
                                  {navbarCategories
                                    .find(nc => nc.id === expandedNavbarCategory)
                                    ?.categories
                                    .find(c => c.id === expandedCategory)
                                    ?.subCategories.map((subCategory) => (
                                      <div
                                        key={subCategory.id}
                                        className="p-3 rounded-lg text-black hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
                                      >
                                        <Link
                                          href={`/products/${navbarCategories.find(nc => nc.id === expandedNavbarCategory)?.slug
                                            }/${navbarCategories
                                              .find(nc => nc.id === expandedNavbarCategory)
                                              ?.categories.find(c => c.id === expandedCategory)?.slug
                                            }/${subCategory.slug}`}
                                          className="flex-1"
                                          onClick={handleLinkClick}
                                        >
                                          <span className="text-sm">{subCategory.name}</span>
                                        </Link>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 cursor-pointer"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="black"
                                          onClick={() => {
                                            setIsMegaMenuOpen(false);
                                            setExpandedNavbarCategory(null);
                                            setExpandedCategory(null);
                                          }}
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </div>
                                    ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-5xl text-gray-300 mb-4">🔍</div>
                            <h3 className="text-black text-lg font-medium mb-2">Explore Our Products</h3>
                            <p className="text-gray-500 text-sm max-w-md">
                              Select a product group from the left to browse our extensive catalog of educational equipment.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-100 p-4 flex justify-between items-center border-t border-gray-200">
                    <Link
                      href="/products"
                      className="text-xs font-medium text-black hover:text-gray-700 transition-colors duration-200"
                      onClick={handleLinkClick}
                    >
                      View All Products →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/certificates"
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide ${activeSection === 'events' ? 'bg-white text-indigo-800' : 'text-gray-800 hover:bg-gray-100'} transition-all duration-300`}
            >
              Certificates
            </Link>

            <Link
              href="/gallery"
              className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide ${activeSection === 'gallery' ? 'bg-white text-indigo-800' : 'text-gray-800 hover:bg-gray-100'} transition-all duration-300`}
            >
              Gallery
            </Link>
          </div>

          {/* Contact Button and Search Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleSearchBar}
              className="p-2 text-gray-600 hover:text-black transition-colors duration-200"
              aria-label="Toggle search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link
              href="/contact"
              className="px-6 py-2.5 bg-black text-white font-medium rounded-full shadow-lg hover:shadow-gray-800/20 transform transition-all duration-300 hover:scale-105"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center z-50">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-black hover:bg-gray-100 focus:outline-none transition-all duration-300"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Sliding */}
      <div
        className={`border-t border-gray-100 transition-all duration-300 ease-in-out ${isSearchBarVisible ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-6 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow duration-200"
            />
            {isSearching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
              </div>
            ) : (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            {searchResults.length > 0 && searchQuery && (
              <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <Link
                    key={index}
                    href={result.url}
                    className="block px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setIsSearchBarVisible(false);
                    }}
                  >
                    <div className="font-medium text-black">{result.title}</div>
                    <div className="text-sm text-gray-500">{result.type}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Updated with Desktop Features */}
      <div className={`md:hidden fixed inset-0 z-50 ${isOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0'
            }`}
          onClick={() => setIsOpen(false)}
        />

        {/* Menu Panel */}
        <div className={`fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          {/* Header with Logo and Close Button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <Image src={logo.src} alt="Lovosis Logo" width={120} height={30} className="object-contain" />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="h-6 w-6" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Certification Badges */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Certifications</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">360°</div>
              <Image src={iso.src} alt="ISO" width={48} height={48} className="rounded-xl" />
              <Image src={ce.src} alt="CE" width={48} height={48} className="rounded-xl" />
              <Image src={si.src} alt="SI" width={48} height={48} className="rounded-xl" />
              <Image src={sk.src} alt="SK" width={48} height={48} className="rounded-xl" />
              <Image src={zed.src} alt="ZED" width={48} height={48} className="rounded-xl" />
              <Image src={gmp.src} alt="GMP" width={48} height={48} className="rounded-xl" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {isSearching ? (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500" />
                </div>
              ) : (
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && searchQuery && (
              <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
                {searchResults.map((result, index) => (
                  <Link
                    key={index}
                    href={result.url}
                    className="block px-4 py-3 hover:bg-gray-50 border-b last:border-0"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setIsOpen(false);
                    }}
                  >
                    <div className="font-medium text-black">{result.title}</div>
                    <div className="text-sm text-gray-500">{result.type}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links with Products Mega Menu */}
          <div className="py-4">
            {['Home', 'About'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-base font-medium">{item}</span>
                <svg className="ml-auto h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            {/* Services Dropdown for Mobile */}
            <div className="border-t border-gray-100">
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-gray-700 hover:bg-gray-50"
                onClick={() => setIsServicesOpen(!isServicesOpen)}
              >
                <span className="text-base font-medium">Services</span>
                <svg
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${isServicesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isServicesOpen && (
                <div className="bg-gray-50 py-2">
                  <Link
                    href="/services/electronics-manufacturing"
                    className="block px-8 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={() => {
                      setIsServicesOpen(false);
                      setIsOpen(false);
                    }}
                  >
                    Electronics Manufacturing
                  </Link>
                  <Link
                    href="/services/it-services"
                    className="block px-8 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    onClick={() => {
                      setIsServicesOpen(false);
                      setIsOpen(false);
                    }}
                  >
                    IT Services
                  </Link>
                </div>
              )}
            </div>

            {/* Products Section with Expandable Categories */}
            <div className="border-t border-b border-gray-100">
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-gray-700 hover:bg-gray-50"
                onClick={() => setExpandedNavbarCategory(expandedNavbarCategory ? null : 'mobile')}
              >
                <span className="text-base font-medium">Products</span>
                <svg
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedNavbarCategory ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Product Categories Nested Dropdown */}
              {expandedNavbarCategory && (
                <div className="bg-gray-50">
                  {navbarCategories.map((navCat) => (
                    <div key={navCat.id} className="border-t border-gray-100 first:border-t-0">
                      {/* Navbar Category Level */}
                      <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-100">
                        <Link
                          href={`/products/${navCat.slug}`}
                          className="flex-1 text-sm font-medium text-gray-800"
                          onClick={handleLinkClick}
                        >
                          {navCat.name}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavbarCategoryClick(navCat.id);
                          }}
                          className="p-1"
                        >
                          <svg
                            className={`h-4 w-4 text-gray-400 transform transition-transform ${expandedNavbarCategory === navCat.id ? 'rotate-180' : ''
                              }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Categories Level */}
                      {expandedNavbarCategory === navCat.id && (
                        <div className="pl-8 pr-4">
                          {navCat.categories.map((cat) => (
                            <div key={cat.id} className="border-t border-gray-100 first:border-t-0">
                              <div className="flex items-center justify-between py-3 hover:bg-gray-100">
                                <Link
                                  href={`/products/${navCat.slug}/${cat.slug}`}
                                  className="flex-1 text-sm text-gray-600"
                                  onClick={handleLinkClick}
                                >
                                  {cat.name}
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleCategoryClick(cat.id);
                                  }}
                                  className="p-1"
                                >
                                  <svg
                                    className={`h-4 w-4 text-gray-400 transform transition-transform ${expandedCategory === cat.id ? 'rotate-180' : ''
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>

                              {/* Subcategories Level */}
                              {expandedCategory === cat.id && (
                                <div className="pl-4 pb-3">
                                  {cat.subCategories.map((subCat) => (
                                    <Link
                                      key={subCat.id}
                                      href={`/products/${navCat.slug}/${cat.slug}/${subCat.slug}`}
                                      className="block py-2 text-sm text-gray-500 hover:text-gray-900"
                                      onClick={handleLinkClick}
                                    >
                                      {subCat.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {['Certificates', 'Gallery'].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="flex items-center px-6 py-4 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-base font-medium">{item}</span>
                <svg className="ml-auto h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Contact Section */}
          <div className="px-6 py-4 bg-gray-50 mt-auto">
            <Link
              href="/contact"
              className="block w-full py-3 px-4 bg-black text-white text-center rounded-xl font-medium hover:bg-gray-900"
              onClick={() => setIsOpen(false)}
            >
              Contact Us
            </Link>

            {/* All Contact Info */}
            <div className="mt-6 space-y-3">
              {[
                { icon: 'phone', href: 'tel:+917012970281', text: '+91 7012970281' },
                { icon: 'email', href: 'mailto:info@lovosis.com', text: 'info@lovosis.com' },
                { icon: 'phone', href: 'tel:+919747745544', text: '+91 9747745544' },
                { icon: 'email', href: 'mailto:lovosist@gmail.com', text: 'lovosist@gmail.com' }
              ].map((contact, index) => (
                <a
                  key={index}
                  href={contact.href}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={contact.icon === 'phone'
                        ? "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        : "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"}
                    />
                  </svg>
                  <span className="text-sm">{contact.text}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;