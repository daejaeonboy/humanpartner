import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Loader2,
  AlertCircle,
  Minus,
  Plus,
  ChevronRight,
  ArrowLeft,
  Package,
  MapPin,
  UtensilsCrossed,
  ShoppingBag,
  FileText,
  MessageCircle,
  X,
  Download,
  RotateCcw,
} from "lucide-react";
import {
  getProductById,
  getProductsByType,
  Product,
} from "../src/api/productApi";
import { createBooking, checkAvailability } from "../src/api/bookingApi";
import { getAllNavMenuItems, NavMenuItem } from "../src/api/cmsApi";
import { useAuth } from "../src/context/AuthContext";
import { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale/ko";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

registerLocale("ko", ko);

import "../src/styles/calendar.css";
import { Helmet } from "react-helmet-async";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [totalPrice, setTotalPrice] = useState(0);
  const [days, setDays] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("detail");
  const [expectedPeople, setExpectedPeople] = useState<number | string>(1);

  // Option Tab State (for the new tab UI)
  const [activeOptionTab, setActiveOptionTab] = useState<
    "additional" | "place" | "food"
  >("additional");

  // Quote Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  // Mobile Floating Bar Expand State (Solution 2)
  const [mobileBarExpanded, setMobileBarExpanded] = useState(false);

  // Basic Components Expand State
  const [basicComponentsExpanded, setBasicComponentsExpanded] = useState(true);

  // Global Options State
  const [globalAdditional, setGlobalAdditional] = useState<Product[]>([]);
  const [globalPlaces, setGlobalPlaces] = useState<Product[]>([]);
  const [globalFoods, setGlobalFoods] = useState<Product[]>([]);

  // Menu Items for hierarchical selection
  const [menuItems, setMenuItems] = useState<NavMenuItem[]>([]);

  // Selected Quantities (Key: Product ID)
  const [selectedAdditional, setSelectedAdditional] = useState<{
    [key: string]: number;
  }>({});
  const [selectedPlaces, setSelectedPlaces] = useState<{
    [key: string]: number;
  }>({});
  const [selectedFoods, setSelectedFoods] = useState<{ [key: string]: number }>(
    {},
  );

  // 계층형 네비게이션 상태
  const [categoryPath, setCategoryPath] = useState<{
    [sectionKey: string]: string[];
  }>({});

  // 아코디언 확장 상태 (Key: "sectionKey-parentName" or "sectionKey-parentName-childName")
  const [expandedAccordion, setExpandedAccordion] = useState<{
    [key: string]: boolean;
  }>({});

  const getParentMenus = (): NavMenuItem[] => {
    return menuItems
      .filter((m) => !m.category)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getChildMenus = (parentName: string): NavMenuItem[] => {
    return menuItems
      .filter((m) => m.category === parentName)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getCategoriesInProducts = (items: Product[]): Set<string> => {
    const categories = new Set<string>();
    items.forEach((p) => {
      if (p.category) categories.add(p.category);
    });
    return categories;
  };

  const getParentMenusWithProducts = (items: Product[]): NavMenuItem[] => {
    const productCategories = getCategoriesInProducts(items);
    const parentMenus = getParentMenus();
    return parentMenus.filter((parent) => {
      const children = getChildMenus(parent.name);
      return children.some((child) => productCategories.has(child.name));
    });
  };

  const getChildMenusWithProducts = (
    parentName: string,
    items: Product[],
  ): NavMenuItem[] => {
    const productCategories = getCategoriesInProducts(items);
    const childMenus = getChildMenus(parentName);
    return childMenus.filter((child) => productCategories.has(child.name));
  };

  // Enhanced Option Item Component with Thumbnail (Responsive)
  const renderEnhancedProductItem = (
    item: Product,
    selectedQty: { [key: string]: number },
    setQty: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
  ) => {
    const qty = selectedQty[item.id!] || 0;
    const subtotal = qty * (item.price || 0);

    return (
      <div
        key={item.id}
        className={`p-3 lg:p-4 rounded-xl border-2 transition-all cursor-pointer group
                    ${
                      qty > 0
                        ? "bg-blue-50 border-blue-300 shadow-md"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                    }`}
      >
        {/* Main Content: Responsive Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
          {/* Top Row (Mobile) / Left Section (PC): Thumbnail + Name/Price */}
          <div className="flex items-center gap-3 mb-3 lg:mb-0 lg:flex-1">
            {/* Thumbnail */}
            <div className="w-12 h-12 lg:w-14 lg:h-14 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package size={20} />
                </div>
              )}
            </div>

            {/* Name & Unit Price */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm lg:text-base leading-tight group-hover:text-blue-700">
                {item.name}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                +{item.price?.toLocaleString()}원
              </p>
            </div>
          </div>

          {/* Bottom Row (Mobile) / Right Section (PC): Quantity + Subtotal */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 lg:pt-0 lg:border-t-0 lg:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 lg:hidden">수량:</span>
              <input
                type="number"
                min="0"
                value={qty || ""}
                placeholder="0"
                onChange={(e) => {
                  e.stopPropagation();
                  const value = parseInt(e.target.value) || 0;
                  if (value <= 0) {
                    const newQty = { ...selectedQty };
                    delete newQty[item.id!];
                    setQty(newQty);
                  } else {
                    setQty({ ...selectedQty, [item.id!]: value });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-9 lg:w-20 lg:h-10 text-center border-2 border-gray-300 rounded-lg font-bold text-base lg:text-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <p
              className={`font-bold text-sm lg:text-base lg:w-28 lg:text-right ${qty > 0 ? "text-[#FF5B60]" : "text-gray-400"}`}
            >
              {subtotal > 0 ? `${subtotal.toLocaleString()}원` : "-"}
            </p>
          </div>
        </div>
      </div>
    );
  };

    // Accordion Options Renderer (New)
    const renderAccordionOptions = (
        sectionKey: string,
        items: Product[],
        selectedQty: { [key: string]: number },
        setQty: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
    ) => {
        const parentMenus = getParentMenusWithProducts(items);

        const toggleAccordion = (key: string) => {
            setExpandedAccordion(prev => ({ ...prev, [key]: !prev[key] }));
        };

        const getSelectedCountForParent = (parentName: string): number => {
            const childMenus = getChildMenusWithProducts(parentName, items);
            let count = 0;
            childMenus.forEach(child => {
                const products = items.filter(p => p.category === child.name);
                products.forEach(p => {
                    if (selectedQty[p.id!] && selectedQty[p.id!] > 0) count += selectedQty[p.id!];
                });
            });
            return count;
        };

        const getSelectedCountForChild = (childName: string): number => {
            const products = items.filter(p => p.category === childName);
            let count = 0;
            products.forEach(p => {
                if (selectedQty[p.id!] && selectedQty[p.id!] > 0) count += selectedQty[p.id!];
            });
            return count;
        };

        if (parentMenus.length === 0) {
            return <div className="text-center py-8 text-gray-400">등록된 카테고리가 없습니다.</div>;
        }

        return (
            <div className="space-y-3">
                {parentMenus.map(parent => {
                    const parentKey = `${sectionKey}-${parent.name}`;
                    const isParentExpanded = expandedAccordion[parentKey] ?? false;
                    const childMenus = getChildMenusWithProducts(parent.name, items);
                    const parentSelectedCount = getSelectedCountForParent(parent.name);

                    return (
                        <div key={parent.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Parent Category Header */}
                            <button
                                onClick={() => toggleAccordion(parentKey)}
                                className={`w-full flex items-center justify-between p-4 text-left transition-all
                                    ${isParentExpanded ? 'bg-blue-50 border-b border-blue-200' : 'bg-white hover:bg-gray-50'}
                                    ${parentSelectedCount > 0 ? 'ring-2 ring-blue-400' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-800">{parent.name}</span>
                                    {parentSelectedCount > 0 && (
                                        <span className="bg-[#FF5B60] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                            {parentSelectedCount}개 선택
                                        </span>
                                    )}
                                </div>
                                <ChevronRight
                                    size={20}
                                    className={`text-gray-400 transition-transform duration-200 ${isParentExpanded ? 'rotate-90' : ''}`}
                                />
                            </button>

                            {/* Parent Expanded Content: Child Categories */}
                            {isParentExpanded && (
                                <div className="bg-gray-50 p-3 space-y-2">
                                    {childMenus.length > 0 ? childMenus.map(child => {
                                        const childKey = `${sectionKey}-${parent.name}-${child.name}`;
                                        const isChildExpanded = expandedAccordion[childKey] ?? false;
                                        const filteredProducts = items.filter(p => p.category === child.name);
                                        const childSelectedCount = getSelectedCountForChild(child.name);

                                        return (
                                            <div key={child.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                {/* Child Category Header */}
                                                <button
                                                    onClick={() => toggleAccordion(childKey)}
                                                    className={`w-full flex items-center justify-between p-3 text-left transition-all
                                                        ${isChildExpanded ? 'bg-green-50 border-b border-green-200' : 'hover:bg-gray-50'}
                                                        ${childSelectedCount > 0 ? 'ring-1 ring-green-400' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-700">{child.name}</span>
                                                        <span className="text-xs text-gray-400">({filteredProducts.length}개)</span>
                                                        {childSelectedCount > 0 && (
                                                            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                                                {childSelectedCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ChevronRight
                                                        size={16}
                                                        className={`text-gray-400 transition-transform duration-200 ${isChildExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                </button>

                                                {/* Child Expanded Content: Products */}
                                                {isChildExpanded && (
                                                    <div className="p-3 space-y-2 bg-white">
                                                        {filteredProducts.length > 0 ? (
                                                            filteredProducts.map(item => renderEnhancedProductItem(item, selectedQty, setQty))
                                                        ) : (
                                                            <div className="text-center py-4 text-gray-400 text-sm">등록된 상품이 없습니다.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-4 text-gray-400 text-sm">등록된 중분류가 없습니다.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };
  const onChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    const fetchProductAndOptions = async () => {
      if (!id) return;
      try {
        const [
          productData,
          additionalData,
          placeData,
          foodData,
          menuItemsData,
        ] = await Promise.all([
          getProductById(id),
          getProductsByType("additional"),
          getProductsByType("place"),
          getProductsByType("food"),
          getAllNavMenuItems(),
        ]);
        setProduct(productData);
        setGlobalAdditional(additionalData);
        setGlobalPlaces(placeData);
        setGlobalFoods(foodData);
        setMenuItems(menuItemsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndOptions();
  }, [id]);

  // 화면 진입 시 스크롤 최상단 이동 (From Colleague's Code)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (startDate && endDate && product) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const validDays = diffDays > 0 ? diffDays : 1;
      setDays(validDays);

      let total = product.price || 0;
      Object.keys(selectedAdditional).forEach((key) => {
        const qty = selectedAdditional[key];
        const item = globalAdditional.find((p) => p.id === key);
        if (item) total += (item.price || 0) * qty;
      });
      Object.keys(selectedPlaces).forEach((key) => {
        const qty = selectedPlaces[key];
        const item = globalPlaces.find((p) => p.id === key);
        if (item) total += (item.price || 0) * qty;
      });
      Object.keys(selectedFoods).forEach((key) => {
        const qty = selectedFoods[key];
        const item = globalFoods.find((p) => p.id === key);
        if (item) total += (item.price || 0) * qty;
      });
      setTotalPrice(total * validDays);
      setAvailabilityError(null);
    }
  }, [
    startDate,
    endDate,
    product,
    selectedAdditional,
    selectedPlaces,
    selectedFoods,
    globalAdditional,
    globalPlaces,
    globalFoods,
  ]);

  const handleBooking = async () => {
    if (!product || !startDate || !endDate || !id) return;
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setIsBooking(true);
    setAvailabilityError(null);
    try {
      const isAvailable = await checkAvailability(
        id,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      );
      if (!isAvailable) {
        setAvailabilityError(
          "선택한 날짜에 이미 예약이 있습니다. 다른 날짜를 선택해주세요.",
        );
        setIsBooking(false);
        return;
      }

      // Collect selected options
      const selectedOptions: {
        name: string;
        quantity: number;
        price: number;
      }[] = [];

      // Additional Items
      Object.keys(selectedAdditional).forEach((key) => {
        const qty = selectedAdditional[key];
        const item = globalAdditional.find((p) => p.id === key);
        if (item && qty > 0) {
          selectedOptions.push({
            name: item.name,
            quantity: qty,
            price: item.price || 0,
          });
        }
      });

      // Place Items
      Object.keys(selectedPlaces).forEach((key) => {
        const qty = selectedPlaces[key];
        const item = globalPlaces.find((p) => p.id === key);
        if (item && qty > 0) {
          selectedOptions.push({
            name: item.name,
            quantity: qty,
            price: item.price || 0,
          });
        }
      });

      // Food Items
      Object.keys(selectedFoods).forEach((key) => {
        const qty = selectedFoods[key];
        const item = globalFoods.find((p) => p.id === key);
        if (item && qty > 0) {
          selectedOptions.push({
            name: item.name,
            quantity: qty,
            price: item.price || 0,
          });
        }
      });

      // Basic Components
      const basicComponents =
        product.basic_components?.map((comp) => ({
          name: comp.name,
          quantity: comp.quantity,
          model_name: comp.model_name,
        })) || [];

      await createBooking({
        product_id: id,
        user_id: user.uid,
        user_email: user.email || undefined,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        total_price: totalPrice,
        status: "pending",
        selected_options: selectedOptions,
        basic_components: basicComponents,
      });
      alert("예약이 완료되었습니다! 마이페이지에서 확인하세요.");
      navigate("/mypage");
    } catch (error) {
      console.error("Booking failed", error);
      alert("예약 처리에 실패했습니다.");
    } finally {
      setIsBooking(false);
    }
  };

  // Calculate selected options summary
  const getSelectedOptionsSummary = () => {
    const summary: { name: string; qty: number; subtotal: number }[] = [];
    Object.entries(selectedAdditional).forEach(([key, qty]) => {
      const item = globalAdditional.find((p) => p.id === key);
      if (item && qty > 0)
        summary.push({ name: item.name, qty, subtotal: item.price * qty });
    });
    Object.entries(selectedPlaces).forEach(([key, qty]) => {
      const item = globalPlaces.find((p) => p.id === key);
      if (item && qty > 0)
        summary.push({ name: item.name, qty, subtotal: item.price * qty });
    });
    Object.entries(selectedFoods).forEach(([key, qty]) => {
      const item = globalFoods.find((p) => p.id === key);
      if (item && qty > 0)
        summary.push({ name: item.name, qty, subtotal: item.price * qty });
    });
    return summary;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-20 text-center text-gray-500">
        상품을 찾을 수 없습니다.
      </div>
    );
  }

  const hasAdditionalOptions =
    product.additional_components &&
    product.additional_components.length > 0 &&
    globalAdditional.length > 0;
  const hasPlaceOptions =
    product.place_components &&
    product.place_components.length > 0 &&
    globalPlaces.length > 0;
  const hasFoodOptions =
    product.food_components &&
    product.food_components.length > 0 &&
    globalFoods.length > 0;
  const hasAnyOptions =
    hasAdditionalOptions || hasPlaceOptions || hasFoodOptions;

  const optionTabs = [
    {
      id: "additional" as const,
      label: "추가 구성",
      icon: Package,
      show: hasAdditionalOptions,
      count: Object.values(selectedAdditional).reduce((a, b) => a + b, 0),
    },
    {
      id: "place" as const,
      label: "장소 상품",
      icon: MapPin,
      show: hasPlaceOptions,
      count: Object.values(selectedPlaces).reduce((a, b) => a + b, 0),
    },
    {
      id: "food" as const,
      label: "음식 상품",
      icon: UtensilsCrossed,
      show: hasFoodOptions,
      count: Object.values(selectedFoods).reduce((a, b) => a + b, 0),
    },
  ].filter((tab) => tab.show);

  const selectedSummary = getSelectedOptionsSummary();

  return (
    <>
      <Helmet>
        <title>{product.name} - 행사어때 렌탈</title>
        <meta
          name="description"
          content={
            product.description ||
            `${product.name} 렌탈 서비스. 행사어때에서 합리적인 가격으로 만나보세요.`
          }
        />
        <meta property="og:title" content={`${product.name} - 행사어때`} />
        <meta
          property="og:description"
          content={product.description || "최고의 파트너 행사어때"}
        />
        <meta
          property="og:image"
          content={
            product.image_url || "https://human-partner.web.app/logo.png"
          }
        />
      </Helmet>
      <div className="py-8 bg-gray-50 min-h-screen pb-24 lg:pb-8">
        <Container>
          {/* Breadcrumbs */}
          {(() => {
            // 현재 카테고리의 상위 카테고리 찾기
            const currentCategoryItem = menuItems.find(
              (m) => m.name === product.category,
            );
            const parentCategoryName = currentCategoryItem?.category || null;

            return (
              <nav className="mb-6">
                <ol className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                  <li>
                    <a
                      href="/"
                      className="hover:text-[#FF5B60] transition-colors"
                    >
                      홈
                    </a>
                  </li>
                  {parentCategoryName && (
                    <>
                      <li>
                        <ChevronRight size={14} className="text-gray-300" />
                      </li>
                      <li>
                        <a
                          href={`/products?category=${encodeURIComponent(parentCategoryName)}`}
                          className="hover:text-[#FF5B60] transition-colors"
                        >
                          {parentCategoryName}
                        </a>
                      </li>
                    </>
                  )}
                  {product.category && (
                    <>
                      <li>
                        <ChevronRight size={14} className="text-gray-300" />
                      </li>
                      <li>
                        <a
                          href={`/products?category=${encodeURIComponent(product.category)}`}
                          className="hover:text-[#FF5B60] transition-colors"
                        >
                          {product.category}
                        </a>
                      </li>
                    </>
                  )}
                  <li>
                    <ChevronRight size={14} className="text-gray-300" />
                  </li>
                  <li className="text-gray-800 font-medium truncate max-w-[200px]">
                    {product.name}
                  </li>
                </ol>

                {/* Category Tags */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {parentCategoryName && (
                    <a
                      href={`/products?category=${encodeURIComponent(parentCategoryName)}`}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      #{parentCategoryName}
                    </a>
                  )}
                  {product.category && (
                    <a
                      href={`/products?category=${encodeURIComponent(product.category)}`}
                      className="px-3 py-1 bg-[#FF5B60]/10 text-[#FF5B60] rounded-full text-xs font-medium hover:bg-[#FF5B60]/20 transition-colors"
                    >
                      #{product.category}
                    </a>
                  )}
                </div>
              </nav>
            );
          })()}

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Image */}
              <div className="aspect-[16/9] bg-gray-200 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={
                    product.image_url ||
                    "https://picsum.photos/seed/product/800/600"
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <span className="text-[#FF5B60] font-bold text-sm mb-2 block">
                  {product.category}
                </span>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                {product.short_description && (
                  <p className="text-gray-500 text-base">
                    {product.short_description}
                  </p>
                )}
                <div className="mt-4 flex items-baseline gap-2">
                  {product.discount_rate && product.discount_rate > 0 && (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">
                      {product.discount_rate}% OFF
                    </span>
                  )}
                  <span className="text-2xl font-bold text-gray-900">
                    {product.price?.toLocaleString()}원
                  </span>
                  <span className="text-sm text-gray-400">/ 1일</span>
                </div>
              </div>

              {/* Calendar & Date Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">
                    날짜 선택
                  </h3>
                  <button
                    onClick={() => {
                      setStartDate(new Date());
                      setEndDate(new Date());
                    }}
                    className="text-sm text-gray-400 hover:text-[#FF5B60] transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={14} />
                    일정 초기화
                  </button>
                </div>
                <div className="custom-calendar-wrapper">
                  <DatePicker
                    selected={startDate}
                    onChange={onChange}
                    startDate={startDate}
                    endDate={endDate}
                    selectsRange
                    inline
                    minDate={new Date()}
                    monthsShown={2}
                    dateFormat="yyyy.MM.dd"
                    locale="ko"
                  />
                </div>
                <div className="flex justify-between items-center py-4 border-t border-gray-100">
                  <span className="font-medium text-gray-700">
                    총 대여 기간
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-[#FF5B60] text-base">
                      {startDate ? startDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                      {' ~ '}
                      {endDate ? endDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">({days}일)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-4 border-t border-gray-100">
                  <span className="font-medium text-gray-700">예상 인원</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expectedPeople}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+$/.test(val)) {
                          setExpectedPeople(val === "" ? "" : parseInt(val));
                        }
                      }}
                      className="w-20 text-right font-bold text-[#FF5B60] text-lg border-b-2 border-gray-300 focus:outline-none focus:border-[#FF5B60] px-2 py-1 bg-transparent"
                      placeholder="0"
                    />
                    <span className="font-medium text-gray-700">명</span>
                  </div>
                </div>
                {availabilityError && (
                  <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={18} />
                    {availabilityError}
                  </div>
                )}
              </div>

              {/* Basic Configuration (Blue Background) - Collapsible */}
              {product.basic_components &&
                product.basic_components.length > 0 && (
                  <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 overflow-hidden">
                    <button
                      onClick={() => setBasicComponentsExpanded(!basicComponentsExpanded)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                          기본
                        </span>
                        <h3 className="font-bold text-gray-900 text-lg">
                          기본 구성 상품
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({product.basic_components.length}개)
                        </span>
                      </div>
                      <ChevronRight
                        size={20}
                        className={`text-gray-400 transition-transform duration-200 ${basicComponentsExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {basicComponentsExpanded && (
                      <div className="px-6 pb-6 space-y-3">
                        {product.basic_components.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-3 bg-white rounded-lg border border-blue-200"
                          >
                            <div className="w-[50px] h-[50px] flex-shrink-0 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Package size={20} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {item.name}
                              </p>
                              {item.model_name && (
                                <p className="text-xs text-gray-400">
                                  {item.model_name}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-blue-600">
                              {item.quantity}개
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {/* Option Tabs Section */}
              {hasAnyOptions && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-200">
                    {optionTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveOptionTab(tab.id);
                          setCategoryPath((prev) => ({
                            ...prev,
                            [tab.id]: [],
                          }));
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold text-sm transition-colors relative
                                                    ${activeOptionTab === tab.id ? "text-[#FF5B60] bg-gray-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                      >
                        <tab.icon size={18} />
                        {tab.label}
                        {tab.count > 0 && (
                          <span className="bg-[#FF5B60] text-white text-xs px-1.5 py-0.5 rounded-full">
                            {tab.count}
                          </span>
                        )}
                        {activeOptionTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF5B60]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeOptionTab === "additional" &&
                      hasAdditionalOptions &&
                      renderAccordionOptions(
                        "additional",
                        globalAdditional,
                        selectedAdditional,
                        setSelectedAdditional,
                      )}
                    {activeOptionTab === "place" &&
                      hasPlaceOptions &&
                      renderAccordionOptions(
                        "place",
                        globalPlaces,
                        selectedPlaces,
                        setSelectedPlaces,
                      )}
                    {activeOptionTab === "food" &&
                      hasFoodOptions &&
                      renderAccordionOptions(
                        "food",
                        globalFoods,
                        selectedFoods,
                        setSelectedFoods,
                      )}
                  </div>
                </div>
              )}

              {/* Tabbed Product Details */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200">
                  {[
                    { id: "detail", label: "상세정보" },
                    { id: "guide", label: "예약안내" },
                    { id: "review", label: "예약후기" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-4 font-semibold text-sm transition-colors relative
                                                ${activeTab === tab.id ? "text-[#FF5B60]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF5B60]" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-6 min-h-[200px]">
                  {activeTab === "detail" &&
                    (product.description ? (
                      <div
                        className="prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: product.description.replace(/\n/g, "<br/>"),
                        }}
                      />
                    ) : (
                      <p className="text-center text-gray-400 py-8">
                        상세 설명이 없습니다.
                      </p>
                    ))}
                  {activeTab === "guide" && (
                    <div className="space-y-4 text-gray-600">
                      <p>
                        상품 대여는 예약 확정 후 진행되며, 지정된 날짜와
                        장소에서 수령 가능합니다.
                      </p>
                      <p>
                        반납은 종료일 18:00까지 지정된 반납 장소로 반납해주셔야
                        합니다.
                      </p>
                    </div>
                  )}
                  {activeTab === "review" && (
                    <p className="text-center text-gray-400 py-8">
                      아직 등록된 후기가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Sticky Sidebar (Desktop Only) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-[#FF5B60]" />
                    예약 요약
                  </h3>

                  {/* Selected Dates */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">대여 기간</span>
                      <span className="font-medium text-gray-900">
                        {days}일
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">예상 인원</span>
                      <span className="font-medium text-gray-900">
                        {expectedPeople || 0}명
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{product.name}</span>
                      <span className="font-medium text-gray-900">
                        {((product.price || 0) * days).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Selected Options Summary */}
                  {selectedSummary.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        선택한 옵션
                      </p>
                      <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                        {selectedSummary.map((opt, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-gray-700"
                          >
                            <span className="truncate flex-1">
                              {opt.name} x{opt.qty}
                            </span>
                            <span className="font-medium ml-2">
                              {(opt.subtotal * days).toLocaleString()}원
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Price */}
                  <div className="mt-6 pt-4 border-t-2 border-gray-900">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">
                        총 결제 금액
                      </span>
                      <span className="text-2xl font-bold text-[#FF5B60]">
                        {totalPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Booking Button */}
                  <button
                    onClick={handleBooking}
                    disabled={isBooking || product.stock === 0}
                    className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 shadow-lg"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> 처리중...
                      </>
                    ) : product.stock === 0 ? (
                      "품절"
                    ) : (
                      "예약하기"
                    )}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-3">
                    예약 확정 후 알림톡이 발송됩니다.
                  </p>

                  {/* Payment Notice */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <p className="text-sm font-bold text-amber-800">
                        법인카드 결제 및 세금계산서 발행 가능
                      </p>
                    </div>
                    <p className="text-xs text-amber-600 mt-1 ml-7">
                      기업 행정 처리를 위한 모든 서류를 지원합니다.
                    </p>
                  </div>

                  {/* Quote Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setShowQuoteModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 transition-all"
                    >
                      <FileText size={18} />
                      견적서 다운로드 (PDF)
                    </button>
                  </div>

                  {/* Certification Badges */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-3">
                      인증 기업
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-blue-100">
                          <img
                            src="/badge-disabled.png"
                            alt="장애인등록기업"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-blue-800 text-sm">
                            장애인등록기업
                          </p>
                          <p className="text-xs text-blue-600">
                            공공기관 우선구매 대상
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-teal-100">
                          <img
                            src="/badge-mice.png"
                            alt="대전 MICE 전문기업"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-teal-800 text-sm">
                            대전 MICE 전문기업
                          </p>
                          <p className="text-xs text-teal-600">
                            지역 행사 전문성 보유
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile Floating Bar - Expandable Version (Solution 2) */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 lg:hidden transition-all duration-300 ${mobileBarExpanded ? "max-h-[80vh]" : "max-h-[80px]"}`}
      >
        {/* Expand Toggle Button */}
        <button
          onClick={() => setMobileBarExpanded(!mobileBarExpanded)}
          className="w-full flex items-center justify-center py-2 bg-gray-50 border-b border-gray-100"
        >
          <ChevronRight
            size={20}
            className={`text-gray-400 transition-transform duration-300 ${mobileBarExpanded ? "rotate-[-90deg]" : "rotate-90"}`}
          />
          <span className="text-xs text-gray-500 ml-1">
            {mobileBarExpanded ? "접기" : "상세보기"}
          </span>
        </button>

        {/* Expanded Content */}
        {mobileBarExpanded && (
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#FF5B60]" />
              예약 요약
            </h3>

            {/* Summary Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">대여 기간</span>
                <span className="font-medium text-gray-900">{days}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">예상 인원</span>
                <span className="font-medium text-gray-900">
                  {expectedPeople || 0}명
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{product.name}</span>
                <span className="font-medium text-gray-900">
                  {((product.price || 0) * days).toLocaleString()}원
                </span>
              </div>
            </div>

            {/* Selected Options */}
            {selectedSummary.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  선택한 옵션
                </p>
                <div className="space-y-2 text-sm">
                  {selectedSummary.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-gray-700"
                    >
                      <span className="truncate flex-1">
                        {opt.name} x{opt.qty}
                      </span>
                      <span className="font-medium ml-2">
                        {(opt.subtotal * days).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Notice */}
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">💳</span>
                <p className="text-sm font-bold text-amber-800">
                  법인카드 결제 및 세금계산서 발행 가능
                </p>
              </div>
            </div>

            {/* Quote Button */}
            <button
              onClick={() => setShowQuoteModal(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 transition-all"
            >
              <FileText size={18} />
              견적서 다운로드 (PDF)
            </button>
          </div>
        )}

        {/* Bottom Bar (Always Visible) */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">총 결제 금액</p>
              <p className="text-xl font-bold text-[#FF5B60]">
                {totalPrice.toLocaleString()}원
              </p>
            </div>
            <button
              onClick={handleBooking}
              disabled={isBooking || product.stock === 0}
              className="flex-1 max-w-[200px] bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isBooking ? (
                <Loader2 className="animate-spin" size={18} />
              ) : null}
              {isBooking
                ? "처리중..."
                : product.stock === 0
                  ? "품절"
                  : "예약하기"}
            </button>
          </div>
        </div>
      </div>

      {/* Quote Preview Modal */}
      {showQuoteModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowQuoteModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                견적서 미리보기
              </h2>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quote Content (for PDF capture) */}
            <div
              ref={quoteRef}
              className="p-8 bg-white"
              style={{ fontFamily: "Malgun Gothic, sans-serif" }}
            >
              {/* Document Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-widest text-gray-900 border-b-4 border-double border-gray-900 pb-4 inline-block px-8">
                  견 적 서
                </h1>
              </div>

              {/* Document Info Table */}
              <table
                className="w-full border-collapse mb-6"
                style={{ fontSize: "12px" }}
              >
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-24 text-center">
                      문서번호
                    </td>
                    <td className="border border-gray-400 px-3 py-2 w-48">
                      Q-{new Date().getFullYear()}
                      {String(new Date().getMonth() + 1).padStart(2, "0")}
                      {String(new Date().getDate()).padStart(2, "0")}-
                      {String(Math.floor(Math.random() * 10000)).padStart(
                        4,
                        "0",
                      )}
                    </td>
                    <td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-24 text-center">
                      발행일자
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      {new Date().toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold text-center">
                      유효기간
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      발행일로부터 30일
                    </td>
                    <td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold text-center">
                      담당자
                    </td>
                    <td className="border border-gray-400 px-3 py-2">영업팀</td>
                  </tr>
                </tbody>
              </table>

              {/* Recipient & Supplier Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Recipient */}
                <div>
                  <p className="font-bold text-sm mb-2 border-b border-gray-900 pb-1">
                    【 수 신 】
                  </p>
                  <table
                    className="w-full border-collapse"
                    style={{ fontSize: "11px" }}
                  >
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold w-16 text-center">
                          상호명
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          (귀사/귀하)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                          담당자
                        </td>
                        <td className="border border-gray-400 px-2 py-1"></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                          연락처
                        </td>
                        <td className="border border-gray-400 px-2 py-1"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Supplier */}
                <div>
                  <p className="font-bold text-sm mb-2 border-b border-gray-900 pb-1">
                    【 발 신 】
                  </p>
                  <table
                    className="w-full border-collapse"
                    style={{ fontSize: "11px" }}
                  >
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold w-16 text-center">
                          상호명
                        </td>
                        <td className="border border-gray-400 px-2 py-1 relative">
                          행사어때 (휴먼파트너)
                          <span className="absolute right-2 top-0 text-[#FF5B60] text-[10px] font-bold">
                            [인]
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                          대표자
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          이승호
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                          연락처
                        </td>
                        <td className="border border-gray-400 px-2 py-1">
                          042-867-6594
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rental Period Info */}
              <table
                className="w-full border-collapse mb-6"
                style={{ fontSize: "12px" }}
              >
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-24 text-center">
                      대여기간
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      {startDate ? startDate.toLocaleDateString("ko-KR") : "-"}{" "}
                      ~ {endDate ? endDate.toLocaleDateString("ko-KR") : "-"} (
                      {days}일간)
                    </td>
                    <td className="border border-gray-400 bg-gray-100 px-3 py-2 font-bold w-24 text-center">
                      예상인원
                    </td>
                    <td className="border border-gray-400 px-3 py-2 w-32">
                      {expectedPeople || "-"}명
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Main Title */}
              <p className="font-bold text-sm mb-2">■ 견적 내역</p>

              {/* Quote Table */}
              <table
                className="w-full border-collapse mb-4"
                style={{ fontSize: "11px" }}
              >
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="border border-gray-600 px-3 py-2 text-center font-bold w-12">
                      No
                    </th>
                    <th className="border border-gray-600 px-3 py-2 text-left font-bold">
                      품목
                    </th>
                    <th className="border border-gray-600 px-3 py-2 text-center font-bold w-16">
                      수량
                    </th>
                    <th className="border border-gray-600 px-3 py-2 text-right font-bold w-24">
                      단가
                    </th>
                    <th className="border border-gray-600 px-3 py-2 text-right font-bold w-28">
                      금액
                    </th>
                    <th className="border border-gray-600 px-3 py-2 text-center font-bold w-20">
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base Product */}
                  <tr>
                    <td className="border border-gray-400 px-3 py-2 text-center">
                      1
                    </td>
                    <td className="border border-gray-400 px-3 py-2 font-medium">
                      {product.name}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-center">
                      {days}일
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right">
                      {product.price?.toLocaleString()}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right font-medium">
                      {((product.price || 0) * days).toLocaleString()}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-center text-gray-500">
                      기본
                    </td>
                  </tr>
                  {/* Basic Components (기본 구성) */}
                  {product.basic_components &&
                    product.basic_components.map((item, idx) => (
                      <tr key={`basic-${idx}`} className="bg-blue-50">
                        <td className="border border-gray-400 px-3 py-1.5 text-center text-gray-400">
                          -
                        </td>
                        <td className="border border-gray-400 px-3 py-1.5 pl-6 text-gray-700">
                          {item.name}
                          {item.model_name && (
                            <span className="text-gray-400 ml-1">
                              ({item.model_name})
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-400 px-3 py-1.5 text-center">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-400 px-3 py-1.5 text-right text-gray-400">
                          -
                        </td>
                        <td className="border border-gray-400 px-3 py-1.5 text-right text-gray-400">
                          -
                        </td>
                        <td className="border border-gray-400 px-3 py-1.5 text-center text-blue-600">
                          기본포함
                        </td>
                      </tr>
                    ))}
                  {/* Selected Options */}
                  {selectedSummary.map((opt, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-400 px-3 py-2 text-center">
                        {(product.basic_components?.length || 0) + idx + 2}
                      </td>
                      <td className="border border-gray-400 px-3 py-2">
                        {opt.name}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center">
                        {opt.qty}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right">
                        {(opt.subtotal / opt.qty).toLocaleString()}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-right">
                        {(opt.subtotal * days).toLocaleString()}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-gray-500">
                        추가
                      </td>
                    </tr>
                  ))}
                  {/* Empty rows for cleaner look */}
                  {selectedSummary.length === 0 &&
                    !product.basic_components?.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="border border-gray-400 px-3 py-4 text-center text-gray-400"
                        >
                          추가 옵션 없음
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>

              {/* Total Section */}
              <table
                className="w-full border-collapse mb-8"
                style={{ fontSize: "12px" }}
              >
                <tbody>
                  <tr>
                    <td className="border-2 border-gray-800 bg-gray-100 px-4 py-3 font-bold text-center w-32">
                      공급가액
                    </td>
                    <td className="border-2 border-gray-800 px-4 py-3 text-right font-medium">
                      {Math.round(totalPrice / 1.1).toLocaleString()}원
                    </td>
                    <td className="border-2 border-gray-800 bg-gray-100 px-4 py-3 font-bold text-center w-24">
                      부가세
                    </td>
                    <td className="border-2 border-gray-800 px-4 py-3 text-right font-medium w-28">
                      {Math.round(
                        totalPrice - totalPrice / 1.1,
                      ).toLocaleString()}
                      원
                    </td>
                    <td className="border-2 border-gray-800 bg-gray-800 text-white px-4 py-3 font-bold text-center w-28">
                      합계금액
                    </td>
                    <td className="border-2 border-gray-800 px-4 py-3 text-right font-bold text-lg text-[#FF5B60] w-32">
                      {totalPrice.toLocaleString()}원
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Notes Section */}
              <div className="mb-6">
                <p className="font-bold text-sm mb-2">■ 유의사항</p>
                <div
                  className="border border-gray-400 p-3"
                  style={{ fontSize: "10px", lineHeight: "1.6" }}
                >
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    <li>본 견적서의 유효기간은 발행일로부터 30일입니다.</li>
                    <li>
                      상기 금액은 부가가치세(VAT 10%)가 포함된 금액입니다.
                    </li>
                    <li>
                      대여 일정 및 장소에 따라 운송비가 별도로 청구될 수
                      있습니다.
                    </li>
                    <li>
                      현장 설치 및 철거가 필요한 경우 별도 협의가 필요합니다.
                    </li>
                    <li>
                      대여 물품의 파손 또는 분실 시 수리비 또는 원가를 청구할 수
                      있습니다.
                    </li>
                    <li>
                      예약 확정을 위해 계약금(총 금액의 50%) 선입금이
                      필요합니다.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div
                className="text-center pt-4 border-t border-gray-300"
                style={{ fontSize: "10px" }}
              >
                <p className="text-gray-500">
                  본 견적서는 정식 계약서가 아니며, 최종 계약 시 세부 사항이
                  변경될 수 있습니다.
                </p>
                <p className="text-gray-600 mt-2 font-medium">
                  행사어때 (휴먼파트너) | 사업자등록번호: 314-07-32520 | 대전
                  유성구 지족로 282번길 17
                </p>
                <p className="text-gray-500 mt-1">
                  Tel. 042-867-6594 | Email. humanpartner@naver.com
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={async () => {
                  if (quoteRef.current) {
                    const canvas = await html2canvas(quoteRef.current, {
                      scale: 2,
                      backgroundColor: "#ffffff",
                    });
                    const imgData = canvas.toDataURL("image/png");
                    const pdf = new jsPDF("p", "mm", "a4");
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                    pdf.save(
                      `견적서_${product.name}_${new Date().toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "")}.pdf`,
                    );
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
              >
                <Download size={18} />
                PDF 다운로드
              </button>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
