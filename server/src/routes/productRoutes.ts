import { Router, Request, Response } from 'express';
import { Product } from '../types';

const router = Router();

// Mock Data
const products: Product[] = [
    {
        id: '1',
        name: '고성능 게이밍 노트북',
        category: 'notebook',
        price: 50000,
        description: '최신 그래픽 카드가 탑재된 고성능 노트북입니다.',
        imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=1000',
        stock: 5,
        discountRate: 15,
        reviewCount: 42,
        rating: 4.8
    },
    {
        id: '2',
        name: '비즈니스 울트라북',
        category: 'notebook',
        price: 35000,
        description: '가볍고 배터리가 오래가는 비즈니스용 노트북입니다.',
        imageUrl: 'https://images.unsplash.com/photo-1531297461136-82lw8zz1223?auto=format&fit=crop&q=80&w=1000',
        stock: 10,
        discountRate: 8,
        reviewCount: 15,
        rating: 4.5
    },
    {
        id: '3',
        name: '컬러 레이저 복합기',
        category: 'printer',
        price: 40000,
        description: '고속 출력과 스캔이 가능한 컬러 레이저 복합기입니다.',
        imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=1000',
        stock: 3,
        reviewCount: 5,
        rating: 4.0
    },
    {
        id: '4',
        name: '회의용 빔프로젝터',
        category: 'office',
        price: 30000,
        description: '선명한 화질의 회의실용 빔프로젝터입니다.',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000',
        stock: 4,
        discountRate: 20,
        reviewCount: 120,
        rating: 4.9
    }
];

// GET /api/products
router.get('/', (req: Request, res: Response) => {
    const category = req.query.category as string;
    if (category && category !== 'all') {
        const filtered = products.filter(p => p.category === category);
        res.json(filtered);
    } else {
        res.json(products);
    }
});

// GET /api/products/:id
router.get('/:id', (req: Request, res: Response) => {
    const product = products.find(p => p.id === req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

export default router;
