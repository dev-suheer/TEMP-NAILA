import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEye } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteStitchingAsync,
  GetAllStitching,
} from "../../../features/stitching";
import { MdOutlineDelete } from "react-icons/md";
import DeleteModal from "../../../Component/Modal/DeleteModal";
import { LuPackageCheck } from "react-icons/lu";
import ProcessFilters from "../../../Component/ProcessFilters/ProcessFilters";
import Pagination from "../../../Component/Common/Pagination";
import { formatReadableDate, getPageLimit } from "../../../Utils/Common";
import ColorList from "../../../Component/Common/ColorList";
import StatusChip from "../../../Component/Common/StatusChip";
import PageLoader from "../../../Component/Loader/PageLoader";

const Stitching = () => {
  const dispatch = useDispatch();
  const { Stitching, loading, deleteloadings } = useSelector(
    (state) => state.stitching
  );
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);
    const [filters, setFilters] = useState(null)
  

  useEffect(() => {
    dispatch(GetAllStitching({ filters, page, limit }));
  }, [dispatch, filters, page, limit]);

  const filteredData = Stitching?.data;

  const openDeleteModal = (id) => {
    setDeleteModal(true);
    setSelectedId(id);
  };

  const closedeleteModal = () => {
    setDeleteModal(false);
  };

  const handleDelete = () => {
    dispatch(deleteStitchingAsync({ id: selectedId })).then((res) => {
      if (res.payload.success === true) {
        dispatch(GetAllStitching({ filters, page, limit }));
        closedeleteModal();
      }
    });
  };

   const liftUpFiltersData = (data) => {
    setFilters(data);
  };


  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[80vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Stitching
          </h1>

          {/* SEARCH FILTERS */}
          <ProcessFilters
            handlers={{ dispatchFunction: GetAllStitching, liftUpFiltersData }}
          />
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>
        {/* -------------- TABLE -------------- */}
        {loading ? (
          <PageLoader />
        ) : (
          <>
            <div className="relative overflow-x-auto mt-5 ">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                  <tr>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 font-medium text-center text-xs md:text-sm"
                      scope="col"
                    >
                      <span className="text-red-500">S.N</span>/
                      <span className="text-green-600">M.N</span>
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      Party Name
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      Design No
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      Rate
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      Colors
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      Date
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      T Quantity
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      R Quantity
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      Status
                    </th>
                    <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData && filteredData?.length > 0 ? (
                    filteredData?.map((data, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <th
                          className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                          scope="row"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-green-500">
                              {data?.packed && <LuPackageCheck size={20} />}
                            </span>
                            <div>
                              <span className="text-red-500">
                                {" "}
                                {data?.serial_No}
                              </span>
                              /
                              <span className="text-green-600">
                                {data?.Manual_No ?? "--"}
                              </span>
                            </div>
                          </div>
                        </th>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.partyName}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.design_no}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.rate}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                          <ColorList items={data.suits_category} />
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                          {formatReadableDate(data.date)}
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{data.Quantity} suit</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                          {data.r_quantity ? `${data.r_quantity} suit` : "--"}
                        </td>
                        <td className=" px-6 py-4">
                          <StatusChip status={data.project_status} fallback="" />
                        </td>
                        <td className="pl-8 py-4 flex gap-3">
                          <Link to={`/dashboard/stitching-details/${data.id}`}>
                            <FaEye size={20} className="cursor-pointer" />
                          </Link>
                          {(!data.bill_generated && !data.packed) && (
                            <button onClick={() => openDeleteModal(data.id)}>
                              <MdOutlineDelete
                                size={20}
                                className="cursor-pointer text-red-500"
                              />
                            </button>
                          )}
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
          </>
        )}
      </section>

      <Pagination
        currentPage={page}
        totalPages={Stitching?.totalPages}
        totalRecords={Stitching?.totalRecords}
        pageSize={limit}
      />
      {/* DELETE MODAL */}
      {deleteModal && (
        <DeleteModal
          title={"Delete Stitching"}
          message={"Are you sure want to delete this Stitching ?"}
          onClose={closedeleteModal}
          Loading={deleteloadings}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default Stitching;
