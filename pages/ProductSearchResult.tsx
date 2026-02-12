import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchProducts, Product } from '../src/api/productApi';
import { Container } from '../components/ui/Container';
import { Loader2, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const ProductSearchResult: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                if (query) {
                    const results = await searchProducts(query);
                    setProducts(results);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="min-h-screen bg-slate-50 py-8 md:py-12">
            <Helmet>
                <title>'{query}' 검색 결과 - 행사어때</title>
            </Helmet>

            <Container>
                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Search className="text-[#FF5B60]" />
                        <span>'{query}' 검색 결과</span>
                        <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border ml-2">
                            총 {products.length}개
                        </span>
                    </h1>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
                    </div>
                )}

                {/* Empty State */}
                {!loading && products.length === 0 && (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">검색 결과가 없습니다</h3>
                        <p className="text-slate-500 mb-6">다른 검색어로 다시 시도해보세요.</p>
                        <div className="flex gap-2 justify-center">
                            <span className="px-3 py-1 bg-slate-100 text-sm text-slate-600 rounded-lg">#의자</span>
                            <span className="px-3 py-1 bg-slate-100 text-sm text-slate-600 rounded-lg">#테이블</span>
                            <span className="px-3 py-1 bg-slate-100 text-sm text-slate-600 rounded-lg">#천막</span>
                        </div>
                    </div>
                )}

                {/* Results Grid */}
                {!loading && products.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                to={`/products/${product.id}`}
                                className="group block bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <span>No Image</span>
                                        </div>
                                    )}
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-800 mb-1 truncate group-hover:text-[#FF5B60] transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-2 line-clamp-1 h-4">
                                        {product.short_description || ''}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-extrabold text-[#FF5B60]">
                                            {product.price?.toLocaleString()}<span className="text-xs font-medium ml-0.5">원</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
};
