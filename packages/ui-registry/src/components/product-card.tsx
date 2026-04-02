

export interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    slug: string;
    imageUrl?: string;
    description?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ name, price, imageUrl, description }) => {
    const imgSrc = imageUrl || '/product-default.png';
    return (
        <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
            <div className="relative h-64 w-full bg-gray-100">
                <img src={imgSrc} alt={name} className="object-cover w-full h-full" />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{name}</h3>
                {description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>}
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-lg font-bold text-gray-900">${price.toFixed(2)}</span>
                    <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};
