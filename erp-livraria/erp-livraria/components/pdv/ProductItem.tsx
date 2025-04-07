import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Book } from '@/models/database.types';
import { formatCurrency } from '@/lib/utils/format';

type ProductItemProps = {
  book: Book;
  onAddToCart: (book: Book) => void;
};

export default function ProductItem({ book, onAddToCart }: ProductItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-medium text-gray-900 line-clamp-1">{book.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-1">{book.author}</p>
      
      {book.isbn && (
        <p className="text-xs text-gray-500 mt-1">ISBN: {book.isbn}</p>
      )}
      
      <div className="mt-2 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">
          {formatCurrency(book.selling_price)}
        </span>
        <button 
          onClick={() => onAddToCart(book)}
          className="rounded-full bg-blue-100 p-1 text-blue-600 hover:bg-blue-200"
          disabled={book.quantity <= 0}
          title={book.quantity <= 0 ? 'Sem estoque disponível' : 'Adicionar ao carrinho'}
        >
          <PlusCircle className={`h-5 w-5 ${book.quantity <= 0 ? 'opacity-50' : ''}`} />
        </button>
      </div>
      
      <p className={`mt-1 text-xs ${book.quantity <= book.minimum_stock ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
        Estoque: {book.quantity} {book.quantity <= book.minimum_stock ? '(baixo)' : 'livros'}
      </p>
    </div>
  );
} 