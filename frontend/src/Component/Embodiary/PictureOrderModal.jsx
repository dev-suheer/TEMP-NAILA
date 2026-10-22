import { useState } from "react";
import ReactSearchBox from "react-search-box";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import {
  createPictureOrderAsync,
  getaccountDataForPicturesAsync,
  GETEmbroiderySIngle,
} from "../../features/EmbroiderySlice";
import toast from "react-hot-toast";
import StatusChip from "../Common/StatusChip";
import ButtonSpinner from "../Common/button/ButtonSpinner";

const PictureOrderModal = ({
  closeModal,
  embroidery_Id,
  design_no,
  serial_No,
  Manual_No,
  receivedSuitQuantity = "",
}) => {
  const dispatch = useDispatch();
  const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
  const [partyValue, setPartyValue] = useState("newParty");
  const [accountData, setAccountData] = useState(null);
  const { accountDataForPictures,createPictureOrderLoading } = useSelector((state) => state.Embroidery);
  const [formData, setFormData] = useState({
    embroidery_Id: embroidery_Id,
    T_Quantity: receivedSuitQuantity,
    design_no: design_no,
    date: today,
    partyName: "",
    rate: "",
    partyType: partyValue,
    accountId: "",
    serial_No:serial_No
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'T_Quantity' || name === 'rate' ? Number(value) : value
    }));
  };

  const togleNameField = (e) => {
    const value = e.target.value;
    setPartyValue(value);
    setFormData((prev) => ({
      ...prev,
      partyName: "",
      partyType:value
    }));
    setAccountData(null);
  };
  const handleSearchOldData = (value) => {
    dispatch(getaccountDataForPicturesAsync({ partyName: value }));
  };
  const handleSelectedRecord = (value) => {
    const Data = accountDataForPictures?.find(
      (item) => item.partyName === value
    );
    setFormData((prev) => ({
        ...prev,
        partyName: value,
        accountId:Data?.id ,
      }));
    if (Data?.partyName === value) {
      setAccountData(Data?.virtual_account);
     
    } else {
      setAccountData(false);
    }
  };

  const searchResults = accountDataForPictures?.map((item) => {
    return {
      key: item.partyName,
      value: item.partyName,
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.partyName === "")
      return toast.error("Please fill all the required fields");
    const payload = {
      ...formData,
      rate: formData.rate * formData.T_Quantity,
      Manual_No:Manual_No
    };

    dispatch(createPictureOrderAsync(payload)).then((res) => {
        if(res.payload.success === true){
            closeModal();
            dispatch(GETEmbroiderySIngle({id: embroidery_Id}));
        }
    })

  };

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full min-h-screen bg-gray-800 bg-opacity-50"
    >
      <div className="relative py-4  px-3 w-[95%] max-w-3xl bg-white rounded-md shadow dark:bg-gray-700 max-h-[85vh] scrollable-content overflow-y-auto">
        {/* ------------- HEADER ------------- */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Enter Pictures Order Bill And Details
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

        {partyValue === "oldParty" && accountData !== null && (
          <div className=" px-8 py-2 flex justify-around items-center border-2 rounded-lg text-gray-900 dark:text-gray-100  dark:border-gray-600">
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

        {/* ------------- BODY ------------- */}
        <div className="p-4 md:p-5">
          <div className="space-y-4">
            {/* INPUT FIELDS DETAILS */}
            <form
              onSubmit={handleSubmit}
              className="mb-8 grid items-start grid-cols-1 lg:grid-cols-2 gap-5"
            >
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
                        handleSelectedRecord(value?.item?.value)
                      }
                      placeholder={formData.partyName === "" ? "Search Party Name" : formData.partyName}
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
                name="date"
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={formData.date}
                onChange={handleInputChange}
                readOnly
              />

              <input
                name="design_no"
                type="text"
                placeholder="Select or Enter D.N"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={formData.design_no}
                readOnly
              />

              <input
                name="T_Quantity"
                type="number"
                placeholder="Enter Quantity"
                className=" bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                value={formData.T_Quantity}
                onChange={handleInputChange}
                required
              />

              <input
                name="rate"
                type="number"
                placeholder="Enter Amount"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                required
                value={formData.rate}
                onChange={handleInputChange}
              />

              <div>
                <button
                  type="submit"
                  disabled={createPictureOrderLoading}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm ${createPictureOrderLoading && 'bg-gray-400 cursor-not-allowed'} rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800`}
                >
                 {createPictureOrderLoading && <ButtonSpinner />}
                 Submit

                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PictureOrderModal;
