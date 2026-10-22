import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPendingRequests, UpdateUser } from "../../features/authSlice";
import { GetAllShop } from "../../features/ShopSlice";
import toast from "react-hot-toast";
import PageLoader from "../../Component/Loader/PageLoader";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";

const PendingRequest = () => {
  const dispatch = useDispatch();
  const { pendingRequest, pendingRequestsLoading } = useSelector(
    (state) => state.auth
  );
  const { Shop } = useSelector((state) => state.Shop);
  const { user } = useSelector((state) => state.auth);
  const [editedUsers, setEditedUsers] = useState([]);

  // Fetch pending requests
  useEffect(() => {
    dispatch(getPendingRequests());
  }, [dispatch]);

  // Set initial values for users when pendingRequest changes
  useEffect(() => {
    if (pendingRequest) {
      setEditedUsers(
        pendingRequest.map((user) => ({
          id: user.id,
          authenticated: user.authenticated,
          branchId: ""
        }))
      );
    }
  }, [pendingRequest, Shop]);

  // Fetch all shops
  useEffect(() => {
   
      dispatch(GetAllShop({ id: user.user.id }));
    
  }, [dispatch, user]);

  // Handle branch change
  const handleBranchChange = (e, index) => {
    const updatedUsers = [...editedUsers];
    updatedUsers[index] = {
      ...updatedUsers[index],
      branchId: e.target.value,
    };
    setEditedUsers(updatedUsers);
  };

  // Handle authenticated change
  const handleAuthenticatedChange = (e, index) => {
    const updatedUsers = [...editedUsers];
    updatedUsers[index] = {
      ...updatedUsers[index],
      authenticated: e.target.value === "Authorized",
    };
    setEditedUsers(updatedUsers);
  };

  // Handle user update
  const handleUpdateUser = (index) => {
    const userData = editedUsers[index];
    if (userData.branchId && userData.authenticated === true ) {
      dispatch(UpdateUser(userData))
        .then((res) => {
          if (res.payload.success === true) {
            dispatch(getPendingRequests()); 
          }
        })
    } else {
      toast.error("Invalid Data to Authorize User");
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
      <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
        <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
          Pending Requests
        </h1>
      </div>

      <p className="w-full bg-gray-300 h-px mt-5"></p>

      {pendingRequestsLoading ? (
        <PageLoader />
      ) : pendingRequest && pendingRequest.length > 0 ? (
        <div className="relative overflow-x-auto mt-5">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs md:text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                  Name
                </th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                  Email
                </th>
                <th className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm" scope="col">
                  Authenticated
                </th>
                <th scope="col" className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">
                  Branch
                </th>
                <th scope="col" className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-xs md:text-sm">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {editedUsers?.map((data, index) => (
                <tr
                  key={index}
                  className="bg-white border-b text-md font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <th
                    className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    scope="row"
                  >
                    {pendingRequest[index]?.name}
                  </th>
                  <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">{pendingRequest[index]?.email}</td>
                  <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                    <ThemedSelect className="w-full"
                      value={data.authenticated ? "Authorized" : "Unauthorized"}
                      onChange={(e) => handleAuthenticatedChange(e, index)}
                    >
                      <option value="Authorized">Authorized</option>
                      <option value="Unauthorized">Unauthorized</option>
                    </ThemedSelect>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    <ThemedSelect variant="ghost" className="min-w-[9rem]"
                      name="branchId"
                      value={data.branchId || "" }
                      onChange={(e) => handleBranchChange(e, index)}
                    >
                        <option value="">No branch selected</option>
                      {Shop?.map((shop) => (
                        <option key={shop?.id} value={shop?.id}>
                          {shop?.branchName}
                        </option>
                      ))}
                    </ThemedSelect>
                  </td>
                  <td className="px-2 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm">
                    <button
                      onClick={() => handleUpdateUser(index)}
                      className="bg-[#252525] hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex justify-center items-center mt-16">
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
            No Data Found
          </h2>
        </div>
      )}
    </section>
  );
};

export default PendingRequest;
