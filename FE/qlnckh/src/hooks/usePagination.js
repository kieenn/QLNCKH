// c:/Users/maing/OneDrive/Documents/KLTN/project/FE/qlnckh/src/hooks/usePagination.js
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axiosConfig'; // Import instance đã cấu hình

/**
 * Custom Hook để quản lý logic phân trang và fetch dữ liệu.
 * @param {string|Function} endpointOrFetcher - URL của API endpoint hoặc một hàm async để fetch dữ liệu.
 * @param {number} initialPage - Trang bắt đầu, mặc định là 1.
 * @param {object} [initialParams={}] - Các tham số truy vấn ban đầu (ví dụ: bộ lọc).
 * @returns {object} - Trạng thái và hàm quản lý phân trang.
 */
function usePagination(endpointOrFetcher, initialPage = 1, initialParams = {}) {
    const [data, setData] = useState([]); // Dữ liệu của trang hiện tại
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [paginationData, setPaginationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [queryParams, setQueryParams] = useState(initialParams); // State cho các tham số truy vấn

    const fetchData = useCallback(async (page) => {
        setLoading(true);
        setError(null);
        const params = {
            page: page,
            ...queryParams // Thêm các tham số lọc vào đây
        };
        console.log(`Fetching data for page ${page} with params:`, params); // Log khi fetch

        try {
            let apiResponseData; // Đổi tên để tránh nhầm lẫn với state 'data'
            // Kiểm tra kiểu của tham số đầu vào
            if (typeof endpointOrFetcher === 'string') {
                // Nếu là string URL -> Gọi trực tiếp bằng apiClient
                const response = await apiClient.get(endpointOrFetcher, { params });
                apiResponseData = response.data; // Lấy dữ liệu từ response.data của axios
            } else if (typeof endpointOrFetcher === 'function') {
                // Nếu là function -> Gọi hàm đó với params
                // Giả định hàm trả về *toàn bộ* Axios response object hoặc chỉ data payload
                const response = await endpointOrFetcher(params);
                // Kiểm tra xem response có phải là Axios response không và lấy .data
                // Nếu hàm fetcher đã tự trả về data payload thì dòng dưới vẫn hoạt động
                apiResponseData = response && response.data ? response.data : response;
            } else {
                throw new Error('usePagination expects a URL string or an API function.');
            }

            // Xử lý apiResponseData (đây là payload, ví dụ: { data: [], links: {}, meta: {} })
            setData(apiResponseData?.data || []); // Dữ liệu items nằm trong apiResponseData.data
            setPaginationData(apiResponseData); // Toàn bộ thông tin phân trang là apiResponseData

            // Cập nhật lại currentPage nếu API trả về trang khác (hiếm khi xảy ra với Laravel paginate)
            if (apiResponseData?.current_page && apiResponseData.current_page !== page) {
                 setCurrentPage(apiResponseData.current_page);
            }
        } catch (err) {
            console.error(`Error fetching pagination data:`, err);
            setError(err.response?.data || err); // Ưu tiên lỗi từ response API
            setData([]); // Xóa dữ liệu cũ nếu có lỗi
            setPaginationData(null);
        } finally {
            setLoading(false);
        }
    }, [endpointOrFetcher, queryParams]); // Dependencies đã được sửa

    useEffect(() => {
        // Chỉ fetch khi không loading để tránh gọi lại khi đang fetch
        if (!loading) {
            fetchData(currentPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, fetchData]); // Fetch lại khi trang thay đổi hoặc fetchData được tạo lại (do queryParams thay đổi)
    // Tắt cảnh báo exhaustive-deps vì chúng ta không muốn fetch lại khi loading thay đổi

    const goToPage = (newPage) => {
        // Chuyển newPage thành số nguyên
        const pageNumber = parseInt(newPage, 10);
        // Kiểm tra kỹ điều kiện trước khi đổi trang
        if (!isNaN(pageNumber) && paginationData && pageNumber >= 1 && pageNumber <= paginationData.last_page && pageNumber !== currentPage) {
            setCurrentPage(pageNumber);
        }
    };

    // Function to manually trigger a refetch of the current page
    const refetch = useCallback(() => {
        // Fetch lại trang hiện tại với params hiện tại
        fetchData(currentPage);
    }, [fetchData, currentPage]);

    // Hàm để cập nhật các tham số lọc và tự động về trang 1
    const updateFilters = useCallback((newParams) => {
        setQueryParams(prevParams => {
            // Tạo params mới, loại bỏ các key có giá trị rỗng hoặc null/undefined
            const cleanedNewParams = Object.entries(newParams).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            // Tạo params cũ đã được làm sạch để so sánh chính xác
            const cleanedPrevParams = Object.entries(prevParams).reduce((acc, [key, value]) => {
                 if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            // So sánh params mới đã làm sạch với params cũ đã làm sạch
            const hasChanged = JSON.stringify(cleanedNewParams) !== JSON.stringify(cleanedPrevParams);

            if (hasChanged) {
                console.log("Updating filters:", cleanedNewParams);
                // Chỉ reset về trang 1 nếu trang hiện tại không phải là 1
                if (currentPage !== 1) {
                    setCurrentPage(1);
                } else {
                    // Nếu đang ở trang 1, cần trigger fetchData thủ công vì currentPage không đổi
                    // Tuy nhiên, fetchData sẽ tự chạy lại do queryParams thay đổi trong dependency của fetchData
                }
                return cleanedNewParams; // Trả về params mới để cập nhật state
            }
            return prevParams; // Trả về params cũ nếu không có gì thay đổi
        });
    }, [currentPage]); // Thêm currentPage vào dependency để logic reset trang hoạt động đúng

    return { data, loading, error, currentPage, paginationData, goToPage, refetch, updateFilters, queryParams }; // Trả về thêm updateFilters và queryParams
}

export default usePagination;
