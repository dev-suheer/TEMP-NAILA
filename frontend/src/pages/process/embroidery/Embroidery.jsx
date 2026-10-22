import { useState, useEffect } from "react";
import { FaEye, FaRegEdit } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Box from "../../../Component/Embodiary/Box";
import { MdOutlineDelete } from "react-icons/md";
import {
  deleteEmbroideryAsync,
  getAllDesignNumbersAsync,
  GETEmbroidery,
  getHeadDataByDesignNoAsync,
  getPreviousDataBypartyNameAsync,
} from "../../../features/EmbroiderySlice";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import AppSelect from "../../../Component/Common/select/AppSelect";
import ReactSearchBox from "react-search-box";
import DeleteModal from "../../../Component/Modal/DeleteModal";
import { LuPackageCheck } from "react-icons/lu";
import ProcessFilters from "../../../Component/ProcessFilters/ProcessFilters";
import { IoAdd } from "react-icons/io5";
import Loading from "../../../Component/Loader/Loading";
import { GetAllBaseforEmroidery } from "../../../features/InStockSlice";
import Icon from "../../../Component/Common/Icons";
import { formatReadableDate, getPageLimit, getTodayDate } from "../../../Utils/Common";
import Pagination from "../../../Component/Common/Pagination";
import ColorList from "../../../Component/Common/ColorList";
import StatusChip from "../../../Component/Common/StatusChip";
import PageLoader from "../../../Component/Loader/PageLoader";
import ThemedSelect from "../../../Component/Common/select/ThemedSelect";

const Embroidery = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [partyValue, setPartyValue] = useState("newParty");
  const {
    loading,
    embroidery,
    designNumbers,
    headStitchData,
    previousDataByPartyName,
    deleteLoadings,
    designNumberLoading,
  } = useSelector((state) => state.Embroidery);
  const { loading: EmbroideryBaseLoading } = useSelector(
    (state) => state.InStock,
  );
  const [accountData, setAccountData] = useState(null);
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = getPageLimit(searchParams);
  const dispatch = useDispatch();
  const today = getTodayDate();
  const [formData, setFormData] = useState({
    partyName: "",
    Manual_No: "",
    partytype: partyValue,
    date: today,
    per_suit: 0,
    rate_per_stitching: "",
    project_status: "",
    design_no: "",
    discount: 0,
    discountType: "RS",
    T_Quantity_In_m: 0,
    T_Quantity: 0,
    Front_Stitch: { value: 0, head: 0 },
    Bazo_Stitch: { value: 0, head: 0 },
    Gala_Stitch: { value: 0, head: 0 },
    Back_Stitch: { value: 0, head: 0 },
    Pallu_Stitch: { value: 0, head: 0 },
    Trouser_Stitch: { value: 0, head: 0 },
    D_Patch_Stitch: { value: 0, head: 0 },
    F_Patch_Stitch: { value: 0, head: 0 },
    project_status: "Pending",
  });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(null);

  useEffect(() => {
    dispatch(GETEmbroidery({ filters, page, limit }));
  }, [dispatch, filters, page, limit]);

  // Convert your design numbers into options for Select
  const designOptions = designNumbers.map((num) => ({
    value: num,
    label: num,
  }));

  const calculateTotal = (formData1) => {
    const rate = parseFloat(formData.rate_per_stitching) || 0;
    const stitches = [
      {
        value: formData1.Front_Stitch.value,
        head: formData1.Front_Stitch.head,
      },
      { value: formData1.Bazo_Stitch.value, head: formData1.Bazo_Stitch.head },
      { value: formData1.Gala_Stitch.value, head: formData1.Gala_Stitch.head },
      { value: formData1.Back_Stitch.value, head: formData1.Back_Stitch.head },
      {
        value: formData1.Pallu_Stitch.value,
        head: formData1.Pallu_Stitch.head,
      },
      {
        value: formData1.Trouser_Stitch.value,
        head: formData1.Trouser_Stitch.head,
      },
      {
        value: formData1.D_Patch_Stitch.value,
        head: formData1.D_Patch_Stitch.head,
      },
      {
        value: formData1.F_Patch_Stitch.value,
        head: formData1.F_Patch_Stitch.head,
      },
    ];

    const total = stitches.reduce((sum, stitch) => {
      const value = parseFloat(stitch.value) || 0;
      const head = parseFloat(stitch.head) || 0;
      const stitchTotal = (value / 1000) * rate * head;
      return sum + stitchTotal;
    }, 0);

    const roundedTotal = Math.round(total * 10000) / 10000;

    return roundedTotal;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const [field, subField] = name.split(".");

    if (subField) {
      setFormData((prevState) => ({
        ...prevState,
        [field]: {
          ...prevState[field],
          [subField]: parseFloat(value),
        },
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSelected = (e) => {
    setFormData((prevState) => {
      return {
        ...prevState,
        design_no: e.value,
      };
    });
    dispatch(getHeadDataByDesignNoAsync({ design_no: e.value })).then((res) => {
      const categories = [
        "Front_Stitch",
        "Bazo_Stitch",
        "Gala_Stitch",
        "Back_Stitch",
        "Pallu_Stitch",
        "D_Patch_Stitch",
        "F_Patch_Stitch",
        "Trouser_Stitch",
      ];

      setFormData((prevState) => {
        const updatedData = { ...prevState };
        categories.forEach((item) => {
          if (res.payload[0][item]) {
            updatedData[item] = {
              value: res.payload[0][item].value,
              head: res.payload[0][item].head,
            };
          }
        });
        return updatedData;
      });
    });
  };

  useEffect(() => {
    if (
      formData.rate_per_stitching ||
      formData.discountType ||
      formData.discount
    ) {
      let totalAmount = calculateTotal(formData);
      if (formData.discount !== "" && formData.discountType === "RS") {
        totalAmount = totalAmount - Number(formData.discount);
      } else if (formData.discount !== "" && formData.discountType === "%") {
        const discountAmount = (Number(formData.discount) / 100) * totalAmount;
        totalAmount = totalAmount - discountAmount;
      }
      setTotal(Number(totalAmount.toFixed(3)));
    }
  }, [formData.rate_per_stitching, formData.discountType, formData.discount]);

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
    dispatch(getAllDesignNumbersAsync());
    dispatch(GetAllBaseforEmroidery());
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
    setAccountData(null);
    setFormData({
      partyName: "",
      partytype: partyValue,
      date: today,
      per_suit: 0,
      rate_per_stitching: "",
      project_status: "",
      design_no: "",
      discount: 0,
      discountType: "RS",
      T_Quantity_In_m: 0,
      T_Quantity: 0,
      Front_Stitch: { value: 0, head: 0 },
      Bazo_Stitch: { value: 0, head: 0 },
      Gala_Stitch: { value: 0, head: 0 },
      Back_Stitch: { value: 0, head: 0 },
      Pallu_Stitch: { value: 0, head: 0 },
      Trouser_Stitch: { value: 0, head: 0 },
      D_Patch_Stitch: { value: 0, head: 0 },
      F_Patch_Stitch: { value: 0, head: 0 },
      project_status: "Pending",
    });
  };

  const filteredData = embroidery?.data;

  const togleNameField = (e) => {
    const value = e.target.value;
    setPartyValue(value);
    setFormData((prev) => ({
      ...prev,
      partyName: "",
    }));
    setAccountData(null);
  };

  const handleSearchOldData = (value) => {
    dispatch(getPreviousDataBypartyNameAsync({ partyName: value }));
  };

  const searchResults = previousDataByPartyName?.embroideryData?.map((item) => {
    return {
      key: item.partyName,
      value: item.partyName,
    };
  });

  const handleSelectedRecord = (value) => {
    const Data = previousDataByPartyName?.accountData.find(
      (item) => item.partyName === value,
    );
    setFormData((prev) => ({
      ...prev,
      partyName: value,
    }));
    if (Data?.partyName === value) {
      setAccountData(Data?.virtual_account);
    } else {
      setAccountData(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteModal(true);
    setSelectedId(id);
  };

  const closedeleteModal = () => {
    setDeleteModal(false);
  };

  const handleDelete = () => {
    dispatch(deleteEmbroideryAsync({ id: selectedId })).then((res) => {
      if (res.payload.success === true) {
        dispatch(GETEmbroidery({ filters, page, limit }));
        closedeleteModal();
      }
    });
  };

  const liftUpFiltersData = (data) => {
    setFilters(data);
  };

  const checkEditableEmroidery = (data) => {
    const { project_status, bill_generated, updated, next_steps } = data;
    const isNextStepsTrue = Object.entries(next_steps).some(
      (item) => item[1] === true,
    );
    if (
      project_status === "Pending" &&
      !bill_generated &&
      !updated &&
      !isNextStepsTrue
    )
      return true;
    return false;
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-[80vh] rounded-lg">
        {/* -------------- HEADER -------------- */}
        <div className="header flex flex-wrap justify-between items-center gap-3 ">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Embroidery
          </h1>

          <div className="flex items-center justify-end gap-3">
            {/* SEARCH FILTERS */}
            <ProcessFilters
              handlers={{ dispatchFunction: GETEmbroidery, liftUpFiltersData }}
            />
            {/* <!-- ADD BUTTON--> */}
            <button
              onClick={openModal}
              className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-0"
            >
              <IoAdd size={22} className="text-white" />
            </button>
          </div>
        </div>

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
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      <span className="text-red-500">S.N</span>/
                      <span className="text-green-600">M.N</span>
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Party Name
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Design No
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Rate
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Colors
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Date
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 font-medium text-center text-xs md:text-sm"
                      scope="col"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 leading-none">
                        <span className="text-gray-700 dark:text-gray-200">
                          Qty
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-500 dark:bg-red-900/30">
                            m
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-600 dark:bg-green-900/30">
                            Suit
                          </span>
                        </div>
                      </div>
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Status/Verified
                    </th>
                    <th
                      className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm font-medium"
                      scope="col"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData && filteredData.length > 0 ? (
                    filteredData?.map((data, index) => (
                          <tr
                            key={data.id || index}
                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          >
                            <th
                              className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                              scope="row"
                            >
                              <div className="flex items-center justify-start gap-2">
                                <span className="text-green-500">
                                  {data?.next_steps?.packing && (
                                    <LuPackageCheck size={20} />
                                  )}
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
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              {data.partyName}
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              {data.design_no}
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              {data.per_suit}
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              <ColorList items={data?.shirt} />
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              {formatReadableDate(data.date)}
                            </td>
                            <td className="px-6 text-center py-4 whitespace-nowrap">
                              <span className="text-red-500">
                                {data?.T_Quantity_In_m}
                              </span>
                              /
                              <span className="text-green-500">
                                {data?.T_Suit ?? "--"}
                              </span>
                            </td>
                            <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                              <div className="flex items-center gap-3">
                                <StatusChip status={data.project_status} fallback="" />
                                {data?.is_verified && (
                                  <span>
                                    <Icon name="tick" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="pl-4 md:pl-6 lg:pl-10 py-2 md:py-3 lg:py-4 flex items-center  gap-3">
                              <Link
                                to={`/dashboard/embroidery-details/${data.id}`}
                              >
                                <FaEye size={20} className="cursor-pointer" />
                              </Link>
                              {checkEditableEmroidery(data) && (
                                <Link
                                  to={`/dashboard/embroidery-update/${data.id}`}
                                >
                                  <FaRegEdit
                                    size={20}
                                    className="cursor-pointer"
                                  />
                                </Link>
                              )}
                              {!data.bill_generated && (
                                <button
                                  onClick={() => openDeleteModal(data.id)}
                                >
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
        totalPages={embroidery?.totalPages}
        totalRecords={embroidery?.totalRecords}
        pageSize={limit}
      />

      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4  px-3 w-[95%] max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700 max-h-[85vh] scrollable-content overflow-y-auto">
            {/* ------------- HEADER ------------- */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Enter Embroidery Bill And Details
              </h3>
              <button
                onClick={closeModal}
                className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 14 14"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            {/* ACCOUNT DATA */}
            {designNumberLoading || EmbroideryBaseLoading ? (
              <div className="flex justify-center my-12 items-center">
                <Loading />
              </div>
            ) : (
              <>
                {partyValue === "oldParty" && accountData === false ? (
                  <div className=" px-3 md:px-6 lg:px-8 py-2 flex flex-wrap justify-around items-center gap-2 border-2 border-red-600 rounded-lg text-green-500 dark:text-green-500  dark:border-red-600">
                    <p>Embroidery Data Found But No Bill Generated Yet</p>
                  </div>
                ) : (
                  <>
                    {partyValue === "oldParty" && accountData !== null && (
                      <div className=" px-3 md:px-6 lg:px-8 py-2 flex flex-wrap justify-around items-center gap-2 border-2 rounded-lg text-gray-900 dark:text-gray-100  dark:border-gray-600">
                        <div className="box text-center">
                          <h3 className="pb-1 font-normal">Total Debit</h3>
                          <h3>{accountData?.total_debit || 0}</h3>
                        </div>
                        <div className="box text-center">
                          <h3 className="pb-1 font-normal">Total Credit</h3>
                          <h3>{accountData?.total_credit || 0}</h3>
                        </div>
                        <div className="box text-center">
                          <h3 className="pb-1 font-normal ">Total Balance</h3>
                          <h3>{accountData?.total_balance || 0}</h3>
                        </div>
                        <div className="box text-center">
                          <h3 className="pb-1 font-normal ">Status</h3>
                          <h3>
                            <StatusChip status={accountData?.status} />
                          </h3>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* ------------- BODY ------------- */}
                <div className="p-4 md:p-5">
                  <div className="space-y-4">
                    {/* INPUT FIELDS DETAILS */}
                    <div className="mb-8 grid items-start grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                      {/* FIRST ROW */}
                      <div className="grid items-center h-full grid-cols-4 gap-1">
                        <label className="col-span-2 ">
                          <input
                            type="radio"
                            name="partyType"
                            value="oldParty"
                            className="bg-gray-50 cursor-pointer border mr-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            onChange={togleNameField}
                            required
                          />
                          Old Party
                        </label>
                        <label className="col-span-2 ">
                          <input
                            type="radio"
                            name="partyType"
                            value="newParty"
                            className="bg-gray-50 cursor-pointer border mr-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            onChange={togleNameField}
                            required
                            defaultChecked
                          />
                          New Party
                        </label>
                      </div>

                      <div>
                        {partyValue === "newParty" ? (
                          <input
                            name="partyName"
                            type="text"
                            placeholder="Party Name"
                            className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            required
                            value={formData.partyName}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <div className="custom-search-box relative">
                            <ReactSearchBox
                              key={searchResults?.key}
                              onSelect={(value) =>
                                handleSelectedRecord(value?.item?.key)
                              }
                              placeholder={
                                formData.partyName === ""
                                  ? "Search Party Name"
                                  : formData.partyName
                              }
                              data={searchResults}
                              onChange={(value) => handleSearchOldData(value)}
                              inputBorderColor="#D1D5DB"
                              inputBackgroundColor="#F9FAFB"
                            />
                            <style jsx>
                              {`
                                .react-search-box-dropdown {
                                  position: absolute;
                                  z-index: 50;
                                  top: 100%;
                                  left: 0;
                                  width: 100%;
                                }
                              `}
                            </style>
                          </div>
                        )}
                      </div>
                      <input
                        name="Manual_No"
                        type="text"
                        placeholder="Manual Number"
                        className="bg-gray-50  border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        required
                        value={formData.Manual_No}
                        onChange={handleInputChange}
                      />
                      <div>
                        <input
                          name="date"
                          type="text"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                          value={formData.date}
                          onChange={handleInputChange}
                          readOnly
                        />
                      </div>
                      <div className="grid items-start grid-cols-3 gap-1">
                        <input
                          name="design_no"
                          type="text"
                          placeholder="Select or Enter D.N"
                          className="bg-gray-50 border col-span-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                          value={formData.design_no}
                          onChange={handleInputChange}
                        />
                        <div className="custom-reactSelect">
                          <AppSelect className="w-full"
                            options={designOptions}
                            placeholder=""
                            onChange={handleSelected}
                            value={
                              formData.design_no
                                ? {
                                    value: formData.design_no,
                                  }
                                : null
                            }
                          />
                        </div>
                      </div>

                      {/* SECOND ROW */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        {/* 1 */}
                        <input
                          name="Front_Stitch.value"
                          type="number"
                          placeholder="Front Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Front_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="Front_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Front_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      {/* 2 */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        <input
                          name="Back_Stitch.value"
                          type="number"
                          placeholder="Back Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Back_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="Back_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Back_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      {/* 3 */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        <input
                          name="Bazo_Stitch.value"
                          type="number"
                          placeholder="Bazu Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Bazo_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="Bazo_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Bazo_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      {/* 4 */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        <input
                          name="Gala_Stitch.value"
                          type="number"
                          placeholder="Gala Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Gala_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="Gala_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Gala_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* THIRD ROW */}
                      {/* 5 */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        <input
                          name="D_Patch_Stitch.value"
                          type="number"
                          placeholder="Dupatta Patch Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.D_Patch_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="D_Patch_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.D_Patch_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      {/* 6 */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        <input
                          name="Pallu_Stitch.value"
                          type="number"
                          placeholder="Pallu Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Pallu_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="Pallu_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Pallu_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      {/* 7 */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        <input
                          name="F_Patch_Stitch.value"
                          type="number"
                          placeholder="Front Patch Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.F_Patch_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="F_Patch_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.F_Patch_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* 8 */}
                      <div className="grid items-start grid-cols-3 gap-2">
                        <input
                          name="Trouser_Stitch.value"
                          type="number"
                          placeholder="Trouser Stitch"
                          className="col-span-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Trouser_Stitch.value || ""}
                          onChange={handleInputChange}
                        />
                        <input
                          name="Trouser_Stitch.head"
                          type="number"
                          placeholder="Head"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          value={formData.Trouser_Stitch.head || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* FOURTH ROW */}
                      <div>
                        <input
                          name="rate_per_stitching"
                          type="number"
                          placeholder="Rate Per Stitch"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                          required
                          value={formData.rate_per_stitching || ""}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* DISCOUNT FIELDS */}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="flex">
                            <input
                              name="discount"
                              type="number"
                              placeholder="Enter Discount"
                              className="bg-gray-50 border rounded-tl-md rounded-bl-md border-gray-300 text-gray-900 text-sm focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                              value={formData.discount || ""}
                              onChange={handleInputChange}
                              required
                            />
                            <ThemedSelect variant="suffix" className="w-20 shrink-0"
                              name="discountType"
                              value={formData.discountType}
                              onChange={handleInputChange}
                            >
                              <option value="RS">RS</option>
                              <option value="%">%</option>
                            </ThemedSelect>
                          </div>
                        </div>
                      </div>

                      {/* TOTAL AFTER DISCOUNT */}
                      <div>
                        <input
                          type="text"
                          value={formData.rate_per_stitching ? total : 0}
                          readOnly
                          name="per_suit"
                          className="bg-gray-50 border-2 border-green-600  text-gray-900 text-sm rounded-md focus:ring-0 focus:border-green-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* SUIT DESCRIPION */}

                    <Box
                      formData1={formData}
                      partyValue={partyValue}
                      setFormData1={setFormData}
                      closeModal={closeModal}
                      total={total}
                      DNO_ategory={headStitchData[0]?.shirt}
                      D_NO={headStitchData[0]?.design_no}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* DELETE MODAL */}
      {deleteModal && (
        <DeleteModal
          title={"Delete Embroidery"}
          message={"Are you sure want to delete this embroidery ?"}
          onClose={closedeleteModal}
          Loading={deleteLoadings}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

export default Embroidery;
