import { ComponentType } from 'react';
import { Hero } from './hero';
import { ProductCard } from './product-card';

export const registry: Record<string, ComponentType<any>> = {
  Hero,
  ProductCard,
};
