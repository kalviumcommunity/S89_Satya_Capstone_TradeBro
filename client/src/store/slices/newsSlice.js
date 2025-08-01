import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { newsAPI } from '../../services/api';

// Initial state
const initialState = {
  articles: [],
  categories: ['all', 'market', 'earnings', 'sector', 'policy'],
  activeCategory: 'all',
  isLoading: false,
  error: null,
  lastUpdated: null
};

// Mock news data
const mockNews = [
  {
    id: 'news001',
    title: 'Reliance Industries Reports Strong Q3 Results, Beats Estimates',
    summary: 'Reliance Industries posted a 12% increase in net profit for Q3, driven by strong performance in retail and digital services segments.',
    category: 'earnings',
    source: 'Economic Times',
    author: 'Financial Reporter',
    publishedAt: new Date('2024-01-15T09:30:00').toISOString(),
    readTime: 3,
    imageUrl: '/api/placeholder/400/200',
    tags: ['RELIANCE', 'Earnings', 'Q3 Results'],
    sentiment: 'positive',
    views: 1250,
    likes: 89,
    isBookmarked: false,
    relatedStocks: ['RELIANCE']
  },
  {
    id: 'news002',
    title: 'IT Sector Outlook: TCS and Infosys Lead Digital Transformation Wave',
    summary: 'Indian IT giants are capitalizing on global digital transformation trends, with strong order books and margin improvements.',
    category: 'sector',
    source: 'Business Standard',
    author: 'Tech Analyst',
    publishedAt: new Date('2024-01-15T08:45:00').toISOString(),
    readTime: 5,
    imageUrl: '/api/placeholder/400/200',
    tags: ['TCS', 'INFY', 'IT Sector', 'Digital'],
    sentiment: 'positive',
    views: 980,
    likes: 67,
    isBookmarked: true,
    relatedStocks: ['TCS', 'INFY', 'WIPRO']
  }
];

// Async thunks
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async ({ category = 'all', limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await newsAPI.getNews({ category, limit });
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return mockNews;
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'news/toggleBookmark',
  async (articleId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const article = state.news.articles.find(a => a.id === articleId);
      
      if (!article) {
        return rejectWithValue('Article not found');
      }
      
      const updatedArticle = {
        ...article,
        isBookmarked: !article.isBookmarked
      };
      
      try {
        await newsAPI.toggleBookmark(articleId);
      } catch (error) {
        console.warn('API failed, updating local bookmark');
      }
      
      return updatedArticle;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to toggle bookmark');
    }
  }
);

// News slice
const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveCategory: (state, action) => {
      state.activeCategory = action.payload;
    },
    updateArticleViews: (state, action) => {
      const articleId = action.payload;
      const article = state.articles.find(a => a.id === articleId);
      if (article) {
        article.views += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articles = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const updatedArticle = action.payload;
        const index = state.articles.findIndex(a => a.id === updatedArticle.id);
        if (index >= 0) {
          state.articles[index] = updatedArticle;
        }
      });
  },
});

export const { clearError, setActiveCategory, updateArticleViews } = newsSlice.actions;
export default newsSlice.reducer;
