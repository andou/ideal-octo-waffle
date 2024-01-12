export type TProduct = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
};

export type TProductImport = {
  sku: string;
  sk: string;
  name: string;
  price: number;
};

export type TStockImport = {
  sku: string;
  sk: string;
  quantity: number;
};
