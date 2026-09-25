import express from 'express';
import {
    listProducts,
    searchProducts,
    addProduct,
    removeProduct,
    singleProduct,
    addProductReview,
    getProductReviews,
    voteReviewHelpful,
    aiProductSearch,
    getAiReviewSummary,
    askProductQuestion,
    getProductQA,
    answerProductQuestion
} from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

productRouter.post('/add',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),addProduct);
productRouter.post('/remove',adminAuth,removeProduct);
productRouter.post('/single',singleProduct);
productRouter.get('/list',listProducts);
productRouter.get('/search',searchProducts);

// Reviews & Ratings routes
productRouter.post('/review/add', addProductReview);
productRouter.get('/review/list/:productId', getProductReviews);
productRouter.post('/review/helpful', voteReviewHelpful);
productRouter.get('/ai-review/:productId', getAiReviewSummary);

// Natural Language AI Shopping Search
productRouter.post('/ai-search', aiProductSearch);

// Customer Q&A routes
productRouter.post('/qa/ask', askProductQuestion);
productRouter.get('/qa/list/:productId', getProductQA);
productRouter.post('/qa/answer', adminAuth, answerProductQuestion);

export default productRouter