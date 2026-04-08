import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import {
  Loader2,
  AlertCircle,
  Minus,
  Plus,
  ChevronRight,
  ArrowLeft,
  Package,
  Users,
  ShoppingBag,
  FileText,
  MessageCircle,
  X,
  Download,
  Check,
  RotateCcw,
  CheckCircle,
  XCircle,
  ListPlus,
  PlusCircle,

  ChevronDown
} from "lucide-react";
import { getProductById, getProductsByIds, getProductsByNames, getProductsByType, Product } from "../src/api/productApi";
import { createBooking, checkAvailability } from "../src/api/bookingApi";
import { getCategories, Category } from "../src/api/categoryApi";
import { createNotification } from "../src/api/notificationApi";
import { useAuth } from "../src/context/AuthContext";
import { usePublicContent } from "../src/context/PublicContentContext";
import { DeferredDateRangePicker } from "../components/product/DeferredDateRangePicker";
import { Seo } from "../components/seo/Seo";
import { DEFAULT_OG_IMAGE, NOINDEX_ROBOTS, absoluteUrl } from "../src/seo";
import {
  applyComponentImageFallback,
  resolveComponentImageUrl,
} from "../src/utils/componentImage";
import { sendBookingRequestNotificationEmail } from "../src/utils/email";
import { getResponsiveImageProps } from "../src/utils/responsiveImage";

const ADDITIONAL_OPTION_GROUP_ORDER = [
  "사무기기",
  "가전/가구",
  "IT 장비",
  "영상/음향",
  "기타 공사",
] as const;

const normalizeAdditionalGroupName = (value?: string | null) => {
  const normalized = (value || "").replace(/\s+/g, "").toLowerCase();

  if (normalized === "사무기기") return "사무기기";
  if (normalized === "가전/가구" || normalized === "가전가구") return "가전/가구";
  if (normalized === "it장비") return "IT 장비";
  if (normalized === "영상/음향" || normalized === "영상음향") return "영상/음향";
  if (normalized === "기타공사") return "기타 공사";

  return null;
};

const getAdditionalFallbackGroup = (item: Product) => {
  const haystack = `${item.category || ""} ${item.name || ""}`;

  if (/복합기|프린터|세단기|사무기기/i.test(haystack)) {
    return "사무기기";
  }

  if (/공기청정기|냉장고|테이블|책상|의자|쇼파|소파|정수기|가전|가구/i.test(haystack)) {
    return "가전/가구";
  }

  if (/노트북|데스크탑|모니터|키오스크|태블릿|pc|it장비|it 장비/i.test(haystack)) {
    return "IT 장비";
  }

  if (/tv|스크린|프로젝터|빔|마이크|스피커|영상|음향/i.test(haystack)) {
    return "영상/음향";
  }

  return "기타 공사";
};

const getAdditionalGroupName = (
  item: Product,
  categoryParentMap: Map<string, string>,
) => {
  const normalizedParentCategory = normalizeAdditionalGroupName(item._parent_category);
  if (normalizedParentCategory) {
    return normalizedParentCategory;
  }

  const configuredParentCategory = item.category
    ? categoryParentMap.get(item.category)
    : null;
  const normalizedConfiguredParent = normalizeAdditionalGroupName(configuredParentCategory);
  if (normalizedConfiguredParent) {
    return normalizedConfiguredParent;
  }

  const normalizedCategory = normalizeAdditionalGroupName(item.category);
  if (normalizedCategory) {
    return normalizedCategory;
  }

  return getAdditionalFallbackGroup(item);
};

const getAdditionalCategoryMeta = (
  item: Product,
  menuItems: { name: string; category?: string | null; display_order: number }[],
  categoryParentMap: Map<string, string>,
) => {
  const childName = item.category || "기타";
  const matchedChildMenu = menuItems.find((menuItem) => menuItem.name === childName && menuItem.category);

  if (matchedChildMenu?.category) {
    const matchedParentMenu = menuItems.find(
      (menuItem) => menuItem.name === matchedChildMenu.category && !menuItem.category,
    );

    return {
      parentName: matchedChildMenu.category,
      parentOrder: matchedParentMenu?.display_order ?? 999,
      childName,
      childOrder: matchedChildMenu.display_order,
    };
  }

  const resolvedParentName = getAdditionalGroupName(item, categoryParentMap);
  const resolvedParentOrder = ADDITIONAL_OPTION_GROUP_ORDER.indexOf(
    resolvedParentName as (typeof ADDITIONAL_OPTION_GROUP_ORDER)[number],
  );

  return {
    parentName: resolvedParentName,
    parentOrder: resolvedParentOrder >= 0 ? resolvedParentOrder : 999,
    childName,
    childOrder: 999,
  };
};

const getAdditionalParentGroups = (
  items: Product[],
  menuItems: { name: string; category?: string | null; display_order: number }[],
  categoryParentMap: Map<string, string>,
) => {
  const groups = new Map<string, number>();

  items.forEach((item) => {
    const meta = getAdditionalCategoryMeta(item, menuItems, categoryParentMap);
    const currentOrder = groups.get(meta.parentName);
    if (currentOrder === undefined || meta.parentOrder < currentOrder) {
      groups.set(meta.parentName, meta.parentOrder);
    }
  });

  return Array.from(groups.entries())
    .map(([name, display_order]) => ({ name, display_order }))
    .sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      return a.name.localeCompare(b.name, "ko-KR");
    });
};

// Sub-component for individual option items to handle local state and focus
const OptionItem = ({
  item,
  initialQty,
  imageUrl,
  onUpdate,
  selectionMode = 'quantity',
}: {
  item: Product;
  initialQty: number;
  imageUrl?: string;
  onUpdate: (qty: number) => void;
  selectionMode?: 'quantity' | 'checkbox';
}) => {
  const [localQty, setLocalQty] = useState(initialQty);

  // Sync local state if external state changes (e.g. when selectedAdditional/Places/Foods changes)
  useEffect(() => {
    setLocalQty(initialQty);
  }, [initialQty]);

  const handleCreate = () => {
    // If user hasn't set a quantity (0), and clicks Add, default to 1.
    // If user has set a quantity (>0), use that.
    const qtyToAdd = localQty > 0 ? localQty : 1;
    onUpdate(qtyToAdd);
    // Update local state to reflect what we just added
    setLocalQty(qtyToAdd);
  };

  const handleUpdate = () => {
    onUpdate(localQty);
  };

  const isInCart = initialQty > 0;
  const isChanged = localQty !== initialQty;
  const imageProps = getResponsiveImageProps(imageUrl, {
    widths: [120, 180, 240],
    sizes: '96px',
    quality: 82,
    resize: 'contain',
  });

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0 relative">
      {/* Image */}
      <div className="relative w-20 sm:w-24 aspect-[4/3] rounded-lg bg-white flex-shrink-0 overflow-hidden border border-gray-100">
        {imageUrl ? (
          <div className="absolute inset-[10%] flex items-center justify-center">
            <img
              {...imageProps}
              alt={item.name}
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
              onError={(e) =>
                applyComponentImageFallback(e.currentTarget, item.name)
              }
            />
          </div>
        ) : (
          <div className="absolute inset-[10%] flex items-center justify-center">
            <Package size={20} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pr-24 sm:pr-0">
        <h5 className="font-bold text-gray-900 text-sm sm:text-[15px] leading-snug line-clamp-1">
          {item.name}
        </h5>
        {item.price > 0 && (
          <p className="text-sm font-bold text-[#39B54A] mt-1">
            {item.price.toLocaleString()}원
          </p>
        )}
      </div>

      {/* Desktop (PC) UI: Original Framed Style */}
      <div className="hidden sm:flex items-center gap-2">
        {selectionMode === 'checkbox' ? (
          <button
            onClick={() => onUpdate(isInCart ? 0 : 1)}
            className={`flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-bold transition-all border
              ${isInCart ? "bg-[#39B54A] text-white border-[#39B54A] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
          >
            <Check size={16} /> {isInCart ? "추가완료" : "추가"}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-[0_1px_3px_rgba(15,23,42,0.04)] h-9">
              <button
                className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                onClick={() => onUpdate(Math.max(0, initialQty - 1))}
              >
                <Minus size={14} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={localQty}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setLocalQty(val === "" ? 0 : parseInt(val));
                  }
                }}
                onBlur={handleUpdate}
                className="w-10 text-center font-bold text-gray-900 text-sm border-none focus:outline-none focus:ring-0 p-0"
              />
              <button
                className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                onClick={() => onUpdate(initialQty + 1)}
              >
                <Plus size={14} />
              </button>
            </div>

            {isInCart ? (
              <button
                onClick={handleUpdate}
                disabled={!isChanged}
                className={`px-4 h-9 rounded-lg text-sm font-bold transition-all
                  ${isChanged ? "bg-[#39B54A] text-white shadow-sm" : "bg-gray-900 text-white"}`}
              >
                {isChanged ? "수정" : <Check size={18} />}
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-4 h-9 rounded-lg text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                담기
              </button>
            )}
          </>
        )}
      </div>

      {/* Mobile UI: Minimal Frameless Style */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:hidden">
        {selectionMode === 'checkbox' ? (
          <button
            onClick={() => onUpdate(isInCart ? 0 : 1)}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all border
              ${isInCart ? "bg-[#39B54A] text-white border-[#39B54A]" : "bg-gray-50 text-gray-400 border-gray-200"}`}
          >
            <Check size={16} />
          </button>
        ) : (
          <>
            <button
              onClick={() => onUpdate(Math.max(0, initialQty - 1))}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors
                ${initialQty > 0 ? "text-gray-900 bg-gray-50" : "text-gray-300 pointer-events-none"}`}
            >
              <Minus size={14} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={localQty}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  setLocalQty(val === "" ? 0 : parseInt(val));
                }
              }}
              onBlur={handleUpdate}
              className={`w-8 text-center font-bold text-sm border-none focus:outline-none focus:ring-0 p-0 bg-transparent
                ${initialQty > 0 ? "text-gray-900" : "text-gray-400"}`}
            />
            <button
              onClick={() => onUpdate(initialQty + 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Plus size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const getCategorizedGroups = (
  items: Product[],
  menuItems: { name: string; category?: string | null; display_order: number }[],
  categoryParentMap: Map<string, string>,
  tabType?: string,
): { name: string, display_order: number }[] => {
  const groups = new Map<string, number>();

  items.forEach(item => {
    const cat = item.category || '기타';
    let groupName = cat;
    let order = 999;

    if (tabType === 'additional') {
      groupName = getAdditionalGroupName(item, categoryParentMap);
      const groupIndex = ADDITIONAL_OPTION_GROUP_ORDER.indexOf(groupName as (typeof ADDITIONAL_OPTION_GROUP_ORDER)[number]);
      order = groupIndex >= 0 ? groupIndex : 999;
    } else {
      const menu = menuItems.find(m => m.name === cat);
      order = menu ? menu.display_order : 999;
    }

    if (!groups.has(groupName)) {
      groups.set(groupName, order);
    } else {
      groups.set(groupName, Math.min(groups.get(groupName)!, order));
    }
  });

  return Array.from(groups.entries())
    .map(([name, display_order]) => ({ name, display_order }))
    .sort((a, b) => {
      if (a.display_order !== b.display_order) return a.display_order - b.display_order;
      // When display_order is the same (e.g. both 999), sort alphabetically by name (가나다 오름차순)
      return a.name.localeCompare(b.name, 'ko-KR');
    });
};

const getQuantityUnit = (item: Product) => {
  const name = item.name || "";

  if (/복합기|프린터|노트북|모니터|키오스크|냉장고|카메라|프로젝터|빔|마이크|스피커|TV|태블릿|PC/i.test(name)) {
    return "대";
  }

  if (
    item.product_type === "cooperative" ||
    item.product_type === "place" ||
    item.product_type === "food" ||
    /촬영|대관|제작|케이터링|운영|설치|철거|통역|사회|진행/i.test(name)
  ) {
    return "건";
  }

  return "개";
};

const formatQuantityLabel = (item: Product, quantity: number) =>
  `${quantity}${getQuantityUnit(item)}`;

const getConfiguredOptionNames = (
  items?: Array<{ name?: string | null }>,
) =>
  Array.from(
    new Set(
      (items || [])
        .map((item) => item.name?.trim())
        .filter((name): name is string => Boolean(name && name !== "__ALL__")),
    ),
  );

const OptionListTypeA = ({
  items,
  selectedQty,
  setQty,
  componentProducts,
  menuItems,
  categoryParentMap,
  tabType,
  selectionMode = 'quantity',
}: {
  items: Product[];
  selectedQty: { [key: string]: number };
  setQty: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  componentProducts: Product[];
  menuItems: { name: string; category?: string | null; display_order: number }[];
  categoryParentMap: Map<string, string>;
  tabType?: string;
  selectionMode?: 'quantity' | 'checkbox';
}) => {
  const additionalParentGroups = React.useMemo(
    () => (
      tabType === "additional"
        ? getAdditionalParentGroups(items, menuItems, categoryParentMap)
        : []
    ),
    [items, menuItems, categoryParentMap, tabType],
  );
  const [localActiveParentCategory, setLocalActiveParentCategory] = useState<string>("");

  // Use useMemo here to prevent recalculation
  const optionGroups = React.useMemo(
    () => (
      tabType === "additional"
        ? []
        : getCategorizedGroups(items, menuItems, categoryParentMap, tabType)
    ),
    [items, menuItems, categoryParentMap, tabType],
  );
  const [localActiveCategory, setLocalActiveCategory] = useState<string>('');

  // Update local state if optionGroups changes
  useEffect(() => {
    if (tabType === "additional") {
      if (additionalParentGroups.length > 0) {
        setLocalActiveParentCategory((prev) => {
          if (prev && additionalParentGroups.some((group) => group.name === prev)) {
            return prev;
          }
          return additionalParentGroups[0].name;
        });
      } else {
        setLocalActiveParentCategory("");
      }
      return;
    }

    if (optionGroups.length > 0) {
      setLocalActiveCategory(prev => {
        // IF previous category is still valid, keep it. Else set to first.
        if (prev && optionGroups.find(p => p.name === prev)) return prev;
        return optionGroups[0].name;
      });
    } else {
      setLocalActiveCategory("");
    }
  }, [additionalParentGroups, optionGroups, tabType]);

  if (tabType === "additional" && additionalParentGroups.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>해당 카테고리에 등록된 상품이 없습니다.</p>
      </div>
    );
  }

  if (tabType !== "additional" && optionGroups.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>해당 카테고리에 등록된 상품이 없습니다.</p>
      </div>
    );
  }

  // Calculating display items based on active category
  let displayItems: Product[] = [];

  if (tabType === 'additional' && localActiveParentCategory) {
    displayItems = items.filter(
      (item) => {
        const meta = getAdditionalCategoryMeta(item, menuItems, categoryParentMap);
        return meta.parentName === localActiveParentCategory;
      },
    );
    displayItems.sort((a, b) => {
      const metaA = getAdditionalCategoryMeta(a, menuItems, categoryParentMap);
      const metaB = getAdditionalCategoryMeta(b, menuItems, categoryParentMap);
      if (metaA.childOrder !== metaB.childOrder) return metaA.childOrder - metaB.childOrder;
      if (metaA.childName !== metaB.childName) return metaA.childName.localeCompare(metaB.childName, 'ko-KR');
      return a.name.localeCompare(b.name, 'ko-KR');
    });
  } else if (localActiveCategory) {
    if (tabType === 'additional') {
      displayItems = items.filter(
        (item) => {
          const meta = getAdditionalCategoryMeta(item, menuItems, categoryParentMap);
          if (meta.parentName !== localActiveParentCategory) {
            return false;
          }
          return localActiveCategory ? meta.childName === localActiveCategory : true;
        },
      );
      displayItems.sort((a, b) => {
        const metaA = getAdditionalCategoryMeta(a, menuItems, categoryParentMap);
        const metaB = getAdditionalCategoryMeta(b, menuItems, categoryParentMap);
        if (metaA.childOrder !== metaB.childOrder) return metaA.childOrder - metaB.childOrder;
        if (metaA.childName !== metaB.childName) return metaA.childName.localeCompare(metaB.childName, 'ko-KR');
        return a.name.localeCompare(b.name, 'ko-KR');
      });
    } else {
      displayItems = items.filter(p => (p.category || '기타') === localActiveCategory);
      displayItems.sort((a, b) => {
        // Sort by creation date (newest first)
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
    }
  }

  return (
    <div>
      {tabType === "additional" ? (
        <>
          <div className="flex overflow-x-auto pb-4 gap-2 px-6 pt-6 border-b border-gray-50 no-scrollbar">
            {additionalParentGroups.map((group) => (
              <button
                key={group.name}
                onClick={() => setLocalActiveParentCategory(group.name)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border
                  ${localActiveParentCategory === group.name
                    ? "bg-[#39B54A] text-white border-[#39B54A]"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex overflow-x-auto pb-4 gap-2 px-6 pt-6 border-b border-gray-50 no-scrollbar">
          {optionGroups.map((group) => (
            <button
              key={group.name}
              onClick={() => setLocalActiveCategory(group.name)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border
                       ${localActiveCategory === group.name
                  ? "bg-[#39B54A] text-white border-[#39B54A]"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}

      {/* List Content */}
      <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2 sm:max-h-[400px]">
        {displayItems.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {displayItems.map((item) => {
              const qty = selectedQty[item.id!] || 0;
              const matchedProduct = componentProducts.find(
                (componentProduct) =>
                  componentProduct.id === item.id ||
                  componentProduct.name === item.name,
              );
              const imageUrl = resolveComponentImageUrl(
                item.name,
                item.image_url,
                matchedProduct?.image_url,
              );

              return (
                <OptionItem
                  key={item.id}
                  item={item}
                  initialQty={qty}
                  imageUrl={imageUrl}
                  onUpdate={(newQty) => setQty(prev => ({ ...prev, [item.id!]: newQty }))}
                  selectionMode={selectionMode}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <p>선택된 카테고리에 상품이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { navMenuItems: menuItems } = usePublicContent();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [days, setDays] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("detail");
  const [expectedPeople, setExpectedPeople] = useState<number | string>(1);
  const [managedCategories, setManagedCategories] = useState<Category[]>([]);

  // Option Tab State (for the new tab UI)
  const [activeOptionTab, setActiveOptionTab] = useState<"cooperative" | "additional">("cooperative");

  // Quote Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  // Booking Result Modal State
  const [bookingModal, setBookingModal] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose?: () => void;
  }>({ show: false, message: '', type: 'info' });

  // Mobile Floating Bar Expand State (Solution 2)
  const [mobileBarExpanded, setMobileBarExpanded] = useState(false);

  // Basic Components Expand State
  const [basicComponentsExpanded, setBasicComponentsExpanded] = useState(true);

  // Global Options State
  const [globalCooperative, setGlobalCooperative] = useState<Product[]>([]);
  const [globalAdditional, setGlobalAdditional] = useState<Product[]>([]);

  // Component Products Lookup (for images)
  const [componentProducts, setComponentProducts] = useState<Product[]>([]);
  const [loadedOptionTabs, setLoadedOptionTabs] = useState<
    Record<"cooperative" | "additional", boolean>
  >({
    cooperative: false,
    additional: false,
  });
  const [loadingOptionTabs, setLoadingOptionTabs] = useState<
    Record<"cooperative" | "additional", boolean>
  >({
    cooperative: false,
    additional: false,
  });
  const configuredOptionNames = React.useMemo(
    () => ({
      cooperative: getConfiguredOptionNames(product?.cooperative_components),
      additional: getConfiguredOptionNames(product?.additional_components),
    }),
    [product],
  );

  const enabledOptionTabs = React.useMemo(
    () => ({
      cooperative: Boolean(product?.cooperative_components?.length),
      additional: Boolean(product?.additional_components?.length),
    }),
    [product],
  );
  const additionalCategoryParentMap = React.useMemo(() => {
    const byId = new Map(managedCategories.map((category) => [category.id, category]));
    const mapping = new Map<string, string>();

    managedCategories.forEach((category) => {
      if (!category.parent_id) return;
      const parent = byId.get(category.parent_id);
      if (!parent) return;
      mapping.set(category.name, parent.name);
    });

    return mapping;
  }, [managedCategories]);

  useEffect(() => {
    const fetchComponentProducts = async () => {
      if (!product?.basic_components?.length) {
        setComponentProducts([]);
        return;
      }

      try {
        const componentIds = product.basic_components
          .map((component) => component.product_id)
          .filter((value): value is string => Boolean(value));
        const componentNames = product.basic_components.map((component) => component.name);

        const [idProducts, nameProducts] = await Promise.all([
          componentIds.length > 0 ? getProductsByIds(componentIds) : Promise.resolve([]),
          getProductsByNames(componentNames),
        ]);

        setComponentProducts(
          Array.from(
            new Map([...idProducts, ...nameProducts].map((componentProduct) => [componentProduct.id, componentProduct])).values(),
          ),
        );
      } catch (err) {
        console.error("Failed to fetch component products", err);
      }
    };

    fetchComponentProducts();
  }, [product]);

  // Selected Quantities (Key: Product ID)
  const [selectedCooperative, setSelectedCooperative] = useState<{
    [key: string]: number;
  }>({});
  const [selectedAdditional, setSelectedAdditional] = useState<{
    [key: string]: number;
  }>({});

  const onChange = (dates: [Date | null, Date | null]) => {
    let [start, end] = dates;

    // 최소 2일 대여 강제 (시작일과 종료일이 같을 경우 종료일을 다음날로 설정)
    if (start && end && start.getTime() === end.getTime()) {
      const nextDay = new Date(start);
      nextDay.setDate(nextDay.getDate() + 1);
      end = nextDay;
    }

    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    const fetchManagedCategories = async () => {
      try {
        const categories = await getCategories();
        setManagedCategories(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setManagedCategories([]);
      }
    };

    fetchManagedCategories();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    setGlobalCooperative([]);
    setGlobalAdditional([]);
    setLoadedOptionTabs({
      cooperative: false,
      additional: false,
    });
    setLoadingOptionTabs({
      cooperative: false,
      additional: false,
    });
    setSelectedCooperative({});
    setSelectedAdditional({});
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const availableTabs = [
      enabledOptionTabs.cooperative ? "cooperative" : null,
      enabledOptionTabs.additional ? "additional" : null,
    ].filter(Boolean) as ("cooperative" | "additional")[];

    if (availableTabs.length > 0 && !availableTabs.includes(activeOptionTab)) {
      setActiveOptionTab(availableTabs[0]);
    }
  }, [activeOptionTab, enabledOptionTabs, product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const nextLoadingState = {
      cooperative: enabledOptionTabs.cooperative,
      additional: enabledOptionTabs.additional,
    };

    setLoadingOptionTabs(nextLoadingState);

    const fetchAllEnabledOptions = async () => {
      try {
        const [cooperativeProducts, additionalProducts] = await Promise.all([
          enabledOptionTabs.cooperative
            ? (configuredOptionNames.cooperative.length > 0
                ? getProductsByNames(configuredOptionNames.cooperative)
                : getProductsByType("cooperative", [], true))
            : Promise.resolve([]),
          enabledOptionTabs.additional
            ? (configuredOptionNames.additional.length > 0
                ? getProductsByNames(configuredOptionNames.additional)
                : getProductsByType("additional", [], true))
            : Promise.resolve([]),
        ]);

        setGlobalCooperative(cooperativeProducts);
        setGlobalAdditional(additionalProducts);
        setLoadedOptionTabs({
          cooperative: enabledOptionTabs.cooperative,
          additional: enabledOptionTabs.additional,
        });
      } catch (error) {
        console.error("Failed to fetch option products:", error);
        setGlobalCooperative([]);
        setGlobalAdditional([]);
      } finally {
        setLoadingOptionTabs({
          cooperative: false,
          additional: false,
        });
      }
    };

    void fetchAllEnabledOptions();
  }, [configuredOptionNames, enabledOptionTabs, product]);

  // 화면 진입 시 스크롤 최상단 이동 (From Colleague's Code)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (startDate && endDate && product) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const validDays = Math.max(2, diffDays); // 최소 2일 보장
      setDays(validDays);

      let total = product.price || 0;
      Object.keys(selectedCooperative).forEach((key) => {
        const qty = selectedCooperative[key];
        const item = globalCooperative.find((p) => p.id === key);
        if (item) total += (item.price || 0) * qty;
      });
      Object.keys(selectedAdditional).forEach((key) => {
        const qty = selectedAdditional[key];
        const item = globalAdditional.find((p) => p.id === key);
        if (item) total += (item.price || 0) * qty;
      });
      setTotalPrice(total); // Fixed price regardless of days
      setAvailabilityError(null);
    }
  }, [
    startDate,
    endDate,
    product,
    selectedCooperative,
    selectedAdditional,
    globalCooperative,
    globalAdditional,
  ]);

  const handleBooking = async () => {
    if (!product || !startDate || !endDate || !id) return;
    if (!user) {
      setBookingModal({
        show: true,
        message: '로그인이 필요합니다.',
        type: 'info',
        onClose: () => navigate('/login'),
      });
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
        setBookingModal({
          show: true,
          message: '선택한 날짜에 이미 예약이 있습니다.\n다른 날짜를 선택해주세요.',
          type: 'error',
        });
        setIsBooking(false);
        return;
      }

      // Collect selected options
      const selectedOptions: {
        name: string;
        quantity: number;
        price: number;
        product_id?: string;
        image_url?: string;
      }[] = [];

      // Cooperative Items
      Object.keys(selectedCooperative).forEach((key) => {
        const qty = selectedCooperative[key];
        const item = globalCooperative.find((p) => p.id === key);
        if (item && qty > 0) {
          selectedOptions.push({
            name: item.name,
            quantity: qty,
            price: item.price || 0,
            product_id: item.id,
            image_url:
              item.image_url ||
              componentProducts.find((productItem) => productItem.id === item.id || productItem.name === item.name)?.image_url,
          });
        }
      });

      // Additional Items
      Object.keys(selectedAdditional).forEach((key) => {
        const qty = selectedAdditional[key];
        const item = globalAdditional.find((p) => p.id === key);
        if (item && qty > 0) {
          selectedOptions.push({
            name: item.name,
            quantity: qty,
            price: item.price || 0,
            product_id: item.id,
            image_url:
              item.image_url ||
              componentProducts.find((productItem) => productItem.id === item.id || productItem.name === item.name)?.image_url,
          });
        }
      });

      // Basic Components
      const basicComponents =
        product.basic_components?.map((comp) => ({
          name: comp.name,
          quantity: comp.quantity,
          model_name: comp.model_name,
          product_id: comp.product_id,
        })) || [];

      const createdBooking = await createBooking({
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

      // Send Notification
      await createNotification(
        user.uid,
        "예약 신청 완료",
        `${product.name} 예약 신청이 접수되었습니다. 관리자 승인 후 확정됩니다.`,
        "info",
        "/mypage" // Link to mypage
      );

      try {
        const idToken = await user.getIdToken();
        await sendBookingRequestNotificationEmail(
          {
            bookingId: createdBooking.id || "예약번호 미확인",
            productName: product.name,
            requesterName: userProfile?.manager_name || userProfile?.name || user.displayName || "예약자",
            companyName: userProfile?.company_name || "",
            phone: userProfile?.phone || "",
            userEmail: user.email || userProfile?.email || "",
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            totalPrice: totalPrice,
            basicComponents,
            selectedOptions,
          },
          idToken,
        );
      } catch (emailError) {
        console.error("Booking request notification email failed", emailError);
      }

      setBookingModal({
        show: true,
        message: '예약이 완료되었습니다!\n마이페이지에서 확인하세요.',
        type: 'success',
        onClose: () => navigate('/mypage'),
      });
    } catch (error) {
      console.error("Booking failed", error);
      setBookingModal({
        show: true,
        message: '예약 처리에 실패했습니다.\n잠시 후 다시 시도해주세요.',
        type: 'error',
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Calculate selected options summary
  const getSelectedOptionsSummary = () => {
    const summary: { name: string; qty: number; subtotal: number; quantityLabel: string }[] = [];
    Object.entries(selectedCooperative).forEach(([key, qty]) => {
      const quantity = qty as number;
      const item = globalCooperative.find((p) => p.id === key);
      if (item && quantity > 0)
        summary.push({
          name: item.name,
          qty: quantity,
          subtotal: item.price * quantity,
          quantityLabel: formatQuantityLabel(item, quantity),
        });
    });
    Object.entries(selectedAdditional).forEach(([key, qty]) => {
      const quantity = qty as number;
      const item = globalAdditional.find((p) => p.id === key);
      if (item && quantity > 0)
        summary.push({
          name: item.name,
          qty: quantity,
          subtotal: item.price * quantity,
          quantityLabel: formatQuantityLabel(item, quantity),
        });
    });
    return summary;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#39B54A]" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <Seo
          title="상품을 찾을 수 없습니다 | 행사어때"
          description="요청하신 상품 정보를 찾을 수 없습니다."
          canonical="/products"
          robots={NOINDEX_ROBOTS}
        />
        <div className="p-20 text-center text-gray-500">
          상품을 찾을 수 없습니다.
        </div>
      </>
    );
  }

  const productPath = `/products/${product.id ?? id ?? ""}`;
  const productTitle = `${product.name} | 행사어때`;
  const productDescription =
    product.short_description ||
    product.description ||
    `${product.name} 렌탈 서비스입니다. 행사어때에서 대전 MICE 행사에 필요한 상품을 확인해보세요.`;
  const productImage = absoluteUrl(product.image_url || DEFAULT_OG_IMAGE);
  const productHeroImageProps = getResponsiveImageProps(
    product.image_url || "https://picsum.photos/seed/product/800/600",
    {
      widths: [640, 960, 1280, 1600],
      sizes: '(max-width: 1024px) 100vw, 66vw',
      quality: 86,
      resize: 'cover',
    },
  );
  const currentCategoryItem = menuItems.find((m) => m.name === product.category);
  const parentCategoryName = currentCategoryItem?.category || null;
  const breadcrumbItems = [
    { name: "홈", item: absoluteUrl("/") },
    ...(parentCategoryName
      ? [
          {
            name: parentCategoryName,
            item: absoluteUrl(`/products?category=${encodeURIComponent(parentCategoryName)}`),
          },
        ]
      : []),
    ...(product.category
      ? [
          {
            name: product.category,
            item: absoluteUrl(`/products?category=${encodeURIComponent(product.category)}`),
          },
        ]
      : []),
    { name: product.name, item: absoluteUrl(productPath) },
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [productImage],
    description: productDescription,
    sku: product.product_code || product.id,
    brand: {
      "@type": "Brand",
      name: "행사어때",
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(productPath),
      priceCurrency: "KRW",
      price: String(product.price || 0),
      availability:
        product.stock === 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };

  const hasAnyOptions = Object.values(enabledOptionTabs).some(Boolean);

  const optionTabs = [
    {
      id: "cooperative" as const,
      label: "부가 서비스",
      icon: Users,
      show: enabledOptionTabs.cooperative,
      count: Object.values(selectedCooperative).filter(qty => (qty as number) > 0).length,
    },
    {
      id: "additional" as const,
      label: "추가 구성",
      icon: Package,
      show: enabledOptionTabs.additional,
      count: Object.values(selectedAdditional).filter(qty => (qty as number) > 0).length,
    },
  ].filter((tab) => tab.show);

  const selectedSummary = getSelectedOptionsSummary();

  return (
    <>
      <Seo
        title={productTitle}
        description={productDescription}
        canonical={productPath}
        image={productImage}
        type="product"
        jsonLd={[breadcrumbSchema, productSchema]}
      />
      <div className="pt-8 pb-8 bg-gray-50 min-h-screen lg:pb-8">
        <Container>
          {/* Breadcrumbs */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <li>
                <a
                  href="/"
                  className="hover:text-[#39B54A] transition-colors"
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
                      className="hover:text-[#39B54A] transition-colors"
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
                      className="hover:text-[#39B54A] transition-colors"
                    >
                      {product.category}
                    </a>
                  </li>
                </>
              )}
            </ol>
          </nav>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Image */}
              <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                <img
                  {...productHeroImageProps}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>

              {/* Product Info */}
              <div className="bg-white rounded-lg p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                <span className="text-[#39B54A] font-bold text-sm mb-2 block">
                  {product.category}
                </span>
                <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
                  {product.name}
                </h1>
                {product.short_description && (
                  <p className="text-gray-500 text-base">
                    {product.short_description}
                  </p>
                )}
                <div className="mt-4 flex items-baseline gap-2">
                  {product.discount_rate && product.discount_rate > 0 && (
                    <span className="bg-[#39B54A]/10 text-[#39B54A] px-2 py-1 rounded text-xs font-bold">
                        {product.discount_rate}% OFF
                    </span>
                  )}
                  <span className="text-2xl font-semibold text-gray-900">
                    {product.price?.toLocaleString()}원
                  </span>
                  <span className="text-sm text-gray-400">/ 1일</span>
                </div>
              </div>

              {/* Calendar & Date Selection */}
              <div className="bg-white rounded-lg p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">
                    날짜 선택
                  </h3>
                  <button
                    onClick={() => {
                      const sd = new Date();
                      const ed = new Date();
                      ed.setDate(ed.getDate() + 1);
                      setStartDate(sd);
                      setEndDate(ed);
                    }}
                    className="text-sm text-gray-400 hover:text-[#39B54A] transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={14} />
                    일정 초기화
                  </button>
                </div>
                <div className="custom-calendar-wrapper">
                  <DeferredDateRangePicker
                    selected={startDate}
                    onChange={onChange}
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    monthsShown={1}
                    dateFormat="yyyy.MM.dd"
                    locale="ko"
                  />
                </div>
                <div className="flex justify-between items-start pt-8 pb-4 border-t border-gray-100">
                  <span className="font-medium text-gray-700 py-1">
                    총 대여 기간
                  </span>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-medium text-gray-900 text-base leading-tight">
                      {startDate ? startDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                      <br className="sm:hidden" />
                      <span className="hidden sm:inline"> ~ </span>
                      <span className="sm:hidden"> ~ </span>
                      {endDate ? endDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                    </span>
                    <span className="text-gray-500 text-sm mt-1">({days}일)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-8 pb-4 border-t border-gray-100">
                  <span className="font-medium text-gray-700">예상 인원</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const current = typeof expectedPeople === 'string' ? parseInt(expectedPeople) || 0 : expectedPeople;
                        if (current > 1) setExpectedPeople(current - 1);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="flex items-center gap-1">
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
                        onBlur={() => {
                          if (expectedPeople === "" || expectedPeople === 0) setExpectedPeople(1);
                        }}
                        className="w-12 text-center font-bold text-gray-900 text-lg border-b border-transparent focus:border-[#39B54A] focus:outline-none bg-transparent p-0"
                        placeholder="0"
                      />
                      <span className="font-medium text-gray-700">명</span>
                    </div>
                    <button
                      onClick={() => {
                        const current = typeof expectedPeople === 'string' ? parseInt(expectedPeople) || 0 : expectedPeople;
                        setExpectedPeople(current + 1);
                      }}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                {availabilityError && (
                  <div className="mt-4 flex items-center gap-2 text-[#39B54A] text-sm bg-[#39B54A]/10 p-3 rounded-lg">
                      <AlertCircle size={18} />
                      {availabilityError}
                  </div>
                )}
              </div>

              {/* Basic Configuration (Restored Box/Frame Style) */}
              {product.basic_components &&
                product.basic_components.length > 0 && (
                  <div className="bg-white rounded-lg p-5 mb-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                    <button
                      onClick={() =>
                        setBasicComponentsExpanded(!basicComponentsExpanded)
                      }
                      className="w-full flex items-center justify-between pb-2 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-[#39B54A] text-white px-2 py-0.5 rounded text-xs font-bold">
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
                        className={`text-gray-400 transition-transform duration-200 ${basicComponentsExpanded ? "rotate-90" : ""}`}
                      />
                    </button>
                    {basicComponentsExpanded && (
                      <div className="space-y-0 mt-2">
                        {product.basic_components.map((item, idx) => {
                          const matchedProduct = componentProducts.find(
                            (componentProduct) =>
                              (item.product_id &&
                                componentProduct.id === item.product_id) ||
                              componentProduct.name === item.name,
                          );
                          const imageUrl = resolveComponentImageUrl(
                            item.name,
                            item.image_url,
                            matchedProduct?.image_url,
                          );
                          const imageProps = getResponsiveImageProps(imageUrl, {
                            widths: [120, 180, 240],
                            sizes: '96px',
                            quality: 82,
                            resize: 'contain',
                          });

                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 sm:gap-4 px-0 py-4 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0"
                            >
                              <div className="relative w-20 sm:w-24 aspect-[4/3] flex-shrink-0 rounded-lg bg-white border border-gray-100 shadow-[0_1px_3px_rgba(15,23,42,0.03)] overflow-hidden">
                                {imageUrl ? (
                                  <div className="absolute inset-[10%] flex items-center justify-center">
                                    <img
                                      {...imageProps}
                                      alt={item.name}
                                      className="w-full h-full object-contain"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        applyComponentImageFallback(
                                          e.currentTarget,
                                          item.name,
                                        );
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="absolute inset-[10%] flex items-center justify-center">
                                    <Package
                                      size={24}
                                      className="text-slate-400"
                                    />
                                  </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 -z-10">
                                  <Package
                                    size={24}
                                    className="text-slate-400"
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-[15px]">
                                  {item.name}
                                </p>
                                {(item.model_name ||
                                  matchedProduct?.product_code) && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {item.model_name ||
                                        matchedProduct?.product_code ||
                                        "P0000"}
                                    </p>
                                  )}
                              </div>
                              <span className="font-bold text-slate-700 bg-white border border-gray-100 px-3 py-1 rounded text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                {item.quantity}개
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              {/* Option Selection Area (Type A: Chip & List) */}
              {hasAnyOptions && (
                <div className="mb-10">
                  {/* Tab Buttons (Underline Style for Type A) */}
                  <div className="flex bg-white rounded-t-xl border-b border-gray-200">
                    {optionTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveOptionTab(tab.id)}
                        className={`flex-1 py-4 font-bold text-sm transition-all relative
                                 ${activeOptionTab === tab.id
                            ? "text-[#39B54A]"
                            : "text-gray-400 hover:text-[#39B54A]"}`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <tab.icon size={18} />
                          {tab.label}
                          {tab.count > 0 && <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                        </div>
                        {activeOptionTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#39B54A]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Chip Filter & List Content */}
                  <div className="bg-white rounded-b-xl border border-gray-100 shadow-[0_4px_14px_rgba(15,23,42,0.04)] overflow-hidden">
                    {activeOptionTab === "cooperative" &&
                      (loadingOptionTabs.cooperative ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                          <Loader2 className="animate-spin mr-2" size={20} />
                          옵션을 불러오는 중입니다.
                        </div>
                      ) : (
                        <OptionListTypeA items={globalCooperative} selectedQty={selectedCooperative} setQty={setSelectedCooperative} componentProducts={componentProducts} menuItems={menuItems} categoryParentMap={additionalCategoryParentMap} tabType="cooperative" selectionMode="checkbox" />
                      ))}
                    {activeOptionTab === "additional" &&
                      (loadingOptionTabs.additional ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                          <Loader2 className="animate-spin mr-2" size={20} />
                          옵션을 불러오는 중입니다.
                        </div>
                      ) : (
                        <OptionListTypeA items={globalAdditional} selectedQty={selectedAdditional} setQty={setSelectedAdditional} componentProducts={componentProducts} menuItems={menuItems} categoryParentMap={additionalCategoryParentMap} tabType="additional" />
                      ))}
                  </div>
                </div>
              )}

              {/* Tabbed Product Details (Restored Box Style) */}
              <div className="bg-white rounded-lg shadow-[0_4px_14px_rgba(15,23,42,0.04)] overflow-hidden mb-10 border border-gray-100">
                <div className="flex border-b border-gray-200">
                  {[
                    { id: "detail", label: "상세정보" },
                    { id: "guide", label: "예약안내" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-4 font-semibold text-sm transition-colors relative
                                                ${activeTab === tab.id ? "text-[#39B54A]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#39B54A]" />
                      )}
                    </button>
                  ))}
                </div>
                <div className={`min-h-[200px] ${activeTab === 'detail' ? '' : 'p-6'}`}>
                  {activeTab === "detail" &&
                    (product.description ? (
                      <div
                        className="prose prose-slate max-w-none w-full [&>p]:m-0 [&_img]:m-0 [&_img]:h-auto [&_img]:max-w-full"
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
                    <div className="space-y-6 text-[15px] leading-[1.6] tracking-[-0.025em] text-gray-600 sm:text-base">
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold leading-[1.6] tracking-[-0.025em] text-gray-900 sm:text-[17px]">
                          1. 예약 문의 접수
                        </p>
                        <p>
                          행사 일정, 장소, 예상 인원, 필요 품목을 남겨주시면
                          운영 목적에 맞는 기본 구성부터 먼저 확인해드립니다.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold leading-[1.6] tracking-[-0.025em] text-gray-900 sm:text-[17px]">
                          2. 현장 조건 확인 및 견적 확정
                        </p>
                        <p>
                          전력, 동선, 설치 시간, 운송 조건 등을 검토한 뒤
                          진행 가능한 구성과 최종 견적을 안내드립니다.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold leading-[1.6] tracking-[-0.025em] text-gray-900 sm:text-[17px]">
                          3. 설치 및 운영 진행
                        </p>
                        <p>
                          확정된 일정에 맞춰 배송과 설치를 진행하며, 행사 종료 후
                          철거와 회수까지 순차적으로 마무리합니다.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold leading-[1.6] tracking-[-0.025em] text-gray-900 sm:text-[17px]">
                          4. 변경 및 취소
                        </p>
                        <p>
                          일정이나 수량 변경은 사전 협의가 필요하며, 준비 진행
                          단계에 따라 추가 비용 또는 취소 비용이 발생할 수
                          있습니다.
                        </p>
                      </div>
                      <div className="pt-4 border-t border-gray-100 text-sm leading-[1.6] tracking-[-0.025em] text-gray-500">
                        최종 비용은 행사 규모, 장소 조건, 운송 거리, 추가 옵션
                        여부에 따라 달라질 수 있습니다.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Sticky Sidebar (Desktop Only) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-lg p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)] border border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2">
                    <ShoppingBag size={20} className="text-[#39B54A]" />
                    예약 요약
                  </h3>
                  <p className="text-[14px] text-gray-500 leading-[1.4] mb-6">
                    상기 금액은 기본 운영 기준 구성에 대한 최소 금액이며,<br />
                    행사 규모 및 일정에 따라 조정될 수 있습니다.
                  </p>

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
                        {(product.price || 0).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Selected Options Summary */}
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
                            <span className="truncate flex-1">{opt.name}</span>
                            <span className="font-medium ml-2">
                              {opt.quantityLabel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Price */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">
                        예상 견적 비용
                      </span>
                      <span className="text-2xl font-bold text-[#39B54A]">
                        {totalPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Booking Button */}
                  <button
                    onClick={handleBooking}
                    disabled={isBooking || product.stock === 0}
                    className="w-full mt-6 bg-[#39B54A] text-white py-4 rounded-lg font-bold hover:bg-[#39B54A]/90 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 shadow-sm"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> 처리중...
                      </>
                    ) : product.stock === 0 ? (
                      "품절"
                    ) : (
                      "견적 받기"
                    )}
                  </button>

                  {/* Quote Button */}
                  <div className="mt-3">
                    <button
                      onClick={() => setShowQuoteModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-[#39B54A] text-[#39B54A] font-semibold hover:bg-green-50 transition-all"
                    >
                      <FileText size={18} />
                      견적서 다운로드 (PDF)
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      예약 후 알림톡이 발송됩니다.
                    </p>
                  </div>

                  {/* Certification Badges */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-3">
                      인증 기업
                    </p>
                    <div className="space-y-4">
                      {/* Certified Company 1 */}
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-100">
                          <img
                            src="/cert-disabled.jpg"
                            alt="장애인등록기업"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            장애인등록기업
                          </p>
                          <p className="text-xs text-gray-500">
                            공공기관 우선구매 대상
                          </p>
                        </div>
                      </div>

                      {/* Certified Company 2 */}
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 border border-gray-100">
                          <img
                            src="/cert-mice.jpg"
                            alt="대전 MICE 전문기업"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            대전 MICE 전문기업
                          </p>
                          <p className="text-xs text-gray-500">
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
        className={`fixed bottom-0 left-0 right-0 overflow-hidden rounded-t-[24px] bg-white border-t border-gray-200 shadow-[0_-10px_24px_rgba(15,23,42,0.10)] z-50 lg:hidden transition-all duration-300 ${mobileBarExpanded ? "max-h-[80vh]" : "max-h-[140px]"}`}
      >
        {/* Expand Toggle Button */}
        <button
          onClick={() => setMobileBarExpanded(!mobileBarExpanded)}
          className="w-full flex items-center justify-center py-2 bg-gray-50 border-b border-gray-100"
        >
          <ChevronRight
            size={20}
            className={`text-gray-400 transition-transform duration-300 ${mobileBarExpanded ? "rotate-90" : "rotate-[-90deg]"}`}
          />
          <span className="text-xs text-gray-500 ml-1">
            {mobileBarExpanded ? "접기" : "상세보기"}
          </span>
        </button>

        {/* Expanded Content */}
        {mobileBarExpanded && (
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#39B54A]" />
              예약 요약
            </h3>
            <p className="text-[14px] text-gray-500 leading-[1.4] mb-6">
              상기 금액은 기본 운영 기준 구성에 대한 최소 금액이며,<br />
              행사 규모 및 일정에 따라 조정될 수 있습니다.
            </p>

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
                  {(product.price || 0).toLocaleString()}원
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
                      <span className="truncate flex-1">{opt.name}</span>
                      <span className="font-medium ml-2">
                        {opt.quantityLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Bar (Always Visible) */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">예상 견적 비용</p>
              <p className="text-xl font-bold text-slate-900">
                {totalPrice.toLocaleString()}원
              </p>
            </div>
            <button
              onClick={handleBooking}
              disabled={isBooking || product.stock === 0}
              className="flex-1 max-w-[200px] bg-[#39B54A] text-white py-3 rounded-lg font-bold hover:bg-[#2F9A3F] transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {isBooking ? (
                <Loader2 className="animate-spin" size={18} />
              ) : null}
              {isBooking
                ? "처리중..."
                : product.stock === 0
                  ? "품절"
                  : "견적 받기"}
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
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
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
            <div className="w-full overflow-x-auto bg-gray-100 p-2 sm:p-4 rounded-b-2xl">
              <div ref={quoteRef} className="min-w-[650px] mx-auto bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] ring-1 ring-gray-200">
                <div
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
                              {userProfile?.company_name || '(미기재)'}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                              담당자
                            </td>
                            <td className="border border-gray-400 px-2 py-1">
                              {userProfile?.manager_name || userProfile?.name || '(미기재)'}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                              연락처
                            </td>
                            <td className="border border-gray-400 px-2 py-1">
                              {userProfile?.phone || '(미기재)'}
                            </td>
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
                              행사어때
                              <span className="absolute right-2 top-0 text-[#39B54A] text-[10px] font-bold">
                                [인]
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                              대표자
                            </td>
                            <td className="border border-gray-400 px-2 py-1">
                              이기섭
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-400 bg-gray-100 px-2 py-1 font-bold text-center">
                              연락처
                            </td>
                            <td className="border border-gray-400 px-2 py-1">
                              010-4074-6967
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
                        <td className="border-2 border-gray-800 bg-gray-100 px-4 py-3 font-bold text-center w-24 whitespace-nowrap">
                          공급가액
                        </td>
                        <td className="border-2 border-gray-800 px-4 py-3 text-right font-medium whitespace-nowrap">
                          {Math.round(totalPrice / 1.1).toLocaleString()}원
                        </td>
                        <td className="border-2 border-gray-800 bg-gray-100 px-4 py-3 font-bold text-center w-20 whitespace-nowrap">
                          부가세
                        </td>
                        <td className="border-2 border-gray-800 px-4 py-3 text-right font-medium whitespace-nowrap">
                          {Math.round(
                            totalPrice - totalPrice / 1.1,
                          ).toLocaleString()}
                          원
                        </td>
                        <td className="border-2 border-gray-800 bg-gray-800 text-white px-4 py-3 font-bold text-center w-24 whitespace-nowrap">
                          합계금액
                        </td>
                        <td className="border-2 border-gray-800 px-4 py-3 text-right font-bold text-lg text-[#39B54A] whitespace-nowrap">
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
                      style={{ fontSize: "11px", lineHeight: "1.7" }}
                    >
                      <ul className="list-disc pl-4 space-y-1.5 text-gray-700">
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
                    style={{ fontSize: "11px" }}
                  >
                    <p className="text-gray-500">
                      본 견적서는 정식 계약서가 아니며, 최종 계약 시 세부 사항이
                      변경될 수 있습니다.
                    </p>
                    <p className="text-gray-600 mt-2 font-medium">
                      행사어때 | 사업자등록번호: 314-07-32520 | 대전
                      유성구 지족로 282번길 17
                    </p>
                    <p className="text-gray-500 mt-1">
                      Tel. 010-4074-6967 | Email. hm_solution@naver.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
	                <button
	                  onClick={async () => {
	                    if (quoteRef.current) {
	                      const { exportElementToPdf } = await import("../src/utils/pdfExport");
	                      await exportElementToPdf(
	                        quoteRef.current,
	                      `견적서_${product.name}_${new Date().toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "")}.pdf`,
	                      );
	                  }
	                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
              >
                <Download size={18} />
                PDF 다운로드
              </button>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Result Modal */}
      {bookingModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => {
          setBookingModal(prev => ({ ...prev, show: false }));
          bookingModal.onClose?.();
        }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-lg shadow-[0_16px_36px_rgba(15,23,42,0.12)] w-full max-w-[360px] p-8 text-center animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5">
              {bookingModal.type === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
              )}
              {bookingModal.type === 'error' && (
                <div className="w-16 h-16 bg-[#39B54A]/10 rounded-full flex items-center justify-center mx-auto">
                  <XCircle size={32} className="text-[#39B54A]" />
                </div>
              )}
              {bookingModal.type === 'info' && (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} className="text-blue-500" />
                </div>
              )}
            </div>
            <p className="text-gray-800 font-semibold text-base leading-relaxed whitespace-pre-line mb-8">
              {bookingModal.message}
            </p>
            <button
              onClick={() => {
                setBookingModal(prev => ({ ...prev, show: false }));
                bookingModal.onClose?.();
              }}
              className="w-full py-3 bg-[#39B54A] text-white font-bold rounded-lg hover:bg-[#2F9A3F] transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
};
