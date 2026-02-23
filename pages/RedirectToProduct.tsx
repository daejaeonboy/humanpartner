import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductByCode, getProductById } from '../src/api/productApi';

export const RedirectToProduct = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const resolveProduct = async () => {
            if (!code) {
                navigate('/');
                return;
            }

            try {
                let product = null;

                // Check if code is a UUID (UUID v4 format check)
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code);

                if (isUuid) {
                    product = await getProductById(code);
                }

                // If not UUID or not found by ID, try looking up by product_code
                if (!product) {
                    product = await getProductByCode(code);
                }

                if (product) {
                    navigate(`/products/${product.id}`, { replace: true });
                } else {
                    // Product not found
                    console.warn(`Product not found for code/id: ${code}`);
                    alert('상품을 찾을 수 없습니다.');
                    navigate('/');
                }
            } catch (error) {
                console.error('Error resolving product code:', error);
                navigate('/');
            }
        };

        resolveProduct();
    }, [code, navigate]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5B60]"></div>
        </div>
    );
};
