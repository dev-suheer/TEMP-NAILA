import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {  useSearchParams } from "react-router-dom";
import {
  deleteSelllerBillAsync,
  getAllPurchasingHistoryAsync,
} from "../../../features/SellerSlice";
import { FaEye } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import ConfirmationModal from "../../../Component/Modal/ConfirmationModal";
import Pagination from "../../../Component/Common/Pagination";
import { formatReadableDate, getPageLimit } from "../../../Utils/Common";
import BooleanIndicator from "../../../Component/Common/BooleanIndicator";
import PurchaseBillRowsModal from "../Modals/PurchaseBillRowsModal";
import {
  deleteBaseBillColorAsync,
  partialDeleteBaseBillColorAsync,
} from "../../../features/InStockSlice";
import PageLoader from "../../../Component/Loader/PageLoader";

const BaseTable = ({ filters = {} }) => {
  const dispatch = useDispatch();

  const { loading, PurchasingHistory,deleteLoading } = useSelector((state) => state.Seller);
  const { deleteStockLoading } = useSelector((state) => state.InStock);

  const [showConfirmationModal, setConfirmationModal] = useState();
  const [onConfitmation, setOnConfirmation] = useState(null);
  const [selectedBaseBill, setSelectedBaseBill] = useState(null);

  const [isOpen, setIsOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  useEffect(() => {
    dispatch(getAllPurchasingHistoryAsync({ category: "Base", ...filters, page, limit }));
  }, [page, limit, dispatch, filters]);


  const closeModal = () => {
    setIsOpen(false);
    setSelectedBaseBill(null);
    setConfirmationModal(false);
    setOnConfirmation(null)
    document.body.style.overflow = "auto";
  };

  const openDetailsModal = (data) => {
    setSelectedBaseBill(data);
    setIsOpen(true);
  };

  const handleDelete = (id) => {
    const pyaload = { billId: id };
    setConfirmationModal(true);
    const deleteBill = () => {
      dispatch(deleteSelllerBillAsync(pyaload)).then((res) => {
          if (res.payload.success) {
          closeModal();
          dispatch(getAllPurchasingHistoryAsync({ category: "Base", ...filters, page, limit }));
        }
      });
    };
    setOnConfirmation(() => deleteBill)
  };

  const refresh = () => {
    dispatch(getAllPurchasingHistoryAsync({ category: "Base", ...filters, page, limit }));
  };

  const handleDeleteColor = (payload) => {
    setConfirmationModal(true);
    document.body.style.overflow = "hidden";
    setOnConfirmation(() => () => {
      dispatch(deleteBaseBillColorAsync({
        billId: payload.billId,
        rowId: payload.rowId,
      })).then((res) => {
        if (res.payload?.success) {
          closeModal();
          refresh();
        }
      });
    });
  };

  const handlePartialDeleteColor = (payload) => {
    setConfirmationModal(true);
    document.body.style.overflow = "hidden";
    setOnConfirmation(() => () => {
      dispatch(partialDeleteBaseBillColorAsync(payload)).then((res) => {
        if (res.payload?.success) {
          closeModal();
          refresh();
        }
      });
    });
  };

  return (
    <>
      <section>
        {loading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-5">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Name
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Bill No
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Category
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Date
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Quantity
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    In Stock
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Rate
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Total
                  </th>
                  <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {PurchasingHistory && PurchasingHistory?.sellers?.length > 0 ? (
                  PurchasingHistory?.sellers?.map((data, index) => (
                      <tr
                        key={data.id || index}
                        className="bg-white border-b text-md font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm" scope="row">
                          {data.name}
                        </td>
                        <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-xs md:text-sm">{data?.bill_no}</th>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.category}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                          {formatReadableDate(data.date)}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.quantity} m</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                          <BooleanIndicator value={data.toAddinStock} />
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.rate}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.total}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                          <div className="flex items-center gap-3">
                            <FaEye
                              onClick={() => openDetailsModal(data)}
                              size={20}
                              className="cursor-pointer text-gray-600 dark:text-gray-200"
                            />
                            <MdDeleteOutline
                              onClick={() => handleDelete(data.id)}
                              size={24}
                              className="cursor-pointer text-red-500"
                            />
                          </div>
                        </td>
                      </tr>
                  ))
                ) : (
                  <tr className="w-full flex justify-center items-center">
                    <td className="text-xl mt-3">No Data Available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination
        currentPage={page}
        totalPages={PurchasingHistory?.totalPages}
        totalRecords={PurchasingHistory?.totalRecords ?? PurchasingHistory?.sellerHistory}
        pageSize={limit}
      />

      <PurchaseBillRowsModal
        isOpen={isOpen}
        onClose={closeModal}
        bill={selectedBaseBill}
        category="Base"
        onDeletePart={handleDeleteColor}
        onPartialDeleteColor={handlePartialDeleteColor}
      />
      {/* CONFIRMATION MODAL */}
      {showConfirmationModal && (
        <ConfirmationModal
          onClose={closeModal}
          onConfirm={onConfitmation}
          message={
            "Are you sure you want to Delete this bill ?"
          }
          title={"Delete Base Bill"}
          updateStitchingLoading={deleteLoading || deleteStockLoading}
        />
      )}
    </>
  );
};

export default BaseTable;
