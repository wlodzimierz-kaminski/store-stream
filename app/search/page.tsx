import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import LoadingDots from 'components/loading-dots';
import { defaultSort, sorting } from 'lib/constants';
import { getProducts } from 'lib/shopify';
import { useEffect, useState } from 'react';

export const runtime = 'edge';

export const metadata = {
  title: 'Search',
  description: 'Search for products in the store.'
};

export default function SearchPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { sort, q: searchValue } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState('');
  const [page, setPage] = useState(1);

  async function fetchProducts() {
    try {
      setIsLoading(true);
      const { products: fetchedProducts, hasNextPage, endCursor } = await getProducts({ sortKey, reverse, query: searchValue, cursor });
      setProducts(prevProducts => [...prevProducts, ...fetchedProducts]);
      setCursor(endCursor || '');
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleScroll() {
    if (!isLoading && window.innerHeight + document.documentElement.scrollTop + 100 >= document.documentElement.offsetHeight) {
      setPage(prevPage => prevPage + 1);
    }
  }

  async function fetchMoreProducts() {
    try {
      if (!isLoading && page > 1) {
        setIsLoading(true);
        const { products: fetchedProducts, hasNextPage, endCursor } = await getProducts({ sortKey, reverse, query: searchValue, cursor, page });
        setProducts(prevProducts => [...prevProducts, ...fetchedProducts]);
        setCursor(endCursor || '');
      }
    } catch (error) {
      console.error('Error fetching more products:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [sortKey, reverse, searchValue, cursor]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  useEffect(() => {
    fetchMoreProducts();
  }, [page]);

  const resultsText = products.length > 1 ? 'results' : 'result';

  return (
    <>
      {searchValue && (
        <p className="mb-4">
          {products.length === 0
            ? 'There are no products that match '
            : `Showing ${products.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      )}
      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <ProductGridItems products={products} />
      </Grid>
      {isLoading && <LoadingDots className="bg-white" />}
    </>
  );
}
