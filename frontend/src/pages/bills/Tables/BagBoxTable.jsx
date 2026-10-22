import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteSelllerBillAsync,
  getAllPurchasingHistoryAsync,
} from "../../../features/SellerSlice";
import ConfirmationModal from "../../../Component/Modal/ConfirmationModal";
import Pagination from "../../../Component/Common/Pagination";
import { formatReadableDate, getPageLimit } from "../../../Utils/Common";
import { MdDeleteOutline } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import PurchaseBillRowsModal from "../Modals/PurchaseBillRowsModal";
import PageLoader from "../../../Component/Loader/PageLoader";

const BagBoxTable = ({ filters = {} }) => {
  const dispatch = useDispatch();

  const { loading, PurchasingHistory, deleteLoading } = useSelector(
    (state) => state.Seller
  );

  const [showConfirmationModal, setConfirmationModal] = useState();
  const [onConfitmation, setOnConfirmation] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);

  useEffect(() => {
    dispatch(
      getAllPurchasingHistoryAsync({ category: "Bag/box", ...filters, page, limit })
    );
  }, [page, limit, dispatch, filters]);


  const closeModal = () => {
    setConfirmationModal(false);
    setOnConfirmation(null);
    document.body.style.overflow = "auto";
  };

  const openDetailsModal = (data) => {
    setSelectedBill(data);
    setIsDetailsOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedBill(null);
    setIsDetailsOpen(false);
  };

  const handleDelete = (id) => {
    const pyaload = { billId: id };
    setConfirmationModal(true);
    document.body.style.overflow = "hidden";
    const deleteBill = () => {
      dispatch(deleteSelllerBillAsync(pyaload)).then((res) => {
        if (res.payload.success) {
          closeModal();
          dispatch(
            getAllPurchasingHistoryAsync({ category: "Bag/box", ...filters, page, limit })
          );
        }
      });
    };
    setOnConfirmation(() => deleteBill);
  };

  return (
    <>
      <section>
        {loading ? (
          <PageLoader />
        ) : (
          <div className="relative overflow-x-auto mt-7">
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
                      key={index}
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
                      <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.quantity} p</td>
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
        isOpen={isDetailsOpen}
        onClose={closeDetailsModal}
        bill={selectedBill}
        category="Bag/box"
      />
      {/* CONFIRMATION MODAL */}
      {showConfirmationModal && (
        <ConfirmationModal
          onClose={closeModal}
          onConfirm={onConfitmation}
          message={
            "Are you sure you want to Delete this bill? Note: The stock associated with this bill will be deleted as well."
          }
          title={"Delete Base Bill"}
          updateStitchingLoading={deleteLoading}
        />
      )}
    </>
  );
};

export default BagBoxTable;
