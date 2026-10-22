import React, { useState, useEffect, useCallback } from "react";
import { IoAdd, IoPencilOutline, IoTrash } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  DeleteShop,
  GetAllShop,
  UpdateShopAsync,
  createShopAsync,
} from "../../features/ShopSlice";
import {
  GetUserBYBranch,
  logoutUserAsync,
  UpdateUser,
} from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import PageLoader from "../../Component/Loader/PageLoader";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";

const Shop = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, Shop } = useSelector((state) => state.Shop);
  const { getUsersForBranch, loading: pendingloading } = useSelector(
    (state) => state.auth
  );
  const [editShop, setEditShop] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    branchName: "",
  });
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [DeleteModal, setDeleteModal] = useState(false);
  const [editedUsers, setEditedUsers] = useState([]);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: "",
    index: null,
  });

  useEffect(() => {
    dispatch(GetAllShop());
  }, [dispatch]);

  const handleEdit = (shop) => {
    setEditShop(shop);
    setFormData({ branchName: shop.branchName });
    setIsOpen(true);
  };

  const handleDelete = (shopId) => {
    setDeleteId(shopId);
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      const data = { branchId: deleteId };
      dispatch(DeleteShop(data)).then((res) => {
        if (res.payload.success === true) {
          setDeleteModal(false);
          logOut();
        }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (editShop) {
      data.branchId = editShop.id;
      dispatch(UpdateShopAsync(data)).then((res) => {
        if (res.payload.success === true) {
          logOut();
        }
      });
    } else {
      dispatch(createShopAsync(data)).then((res) => {
        if (res.payload.success === true) {
          logOut();
        }
      });
    }
  };

  //FETCH USERS FOR BRANCH
  useEffect(() => {
    if (Shop.length > 0 && selectedShopId === null) {
      const data = { branchId: Shop[0]?.id };
      setSelectedShopId(Shop[0]?.id);
      dispatch(GetUserBYBranch(data));
    }
  }, [Shop, dispatch, selectedShopId]);

  const fetchBranchUser = (branchId) => {
    setSelectedShopId(branchId);
    const data = { branchId: branchId };
    dispatch(GetUserBYBranch(data));
  };

  const handleRoleChange = (e, index) => {
    const updatedUsers = [...editedUsers];
    updatedUsers[index] = {
      ...getUsersForBranch[index],
      role: e.target.value,
    };
    setEditedUsers(updatedUsers);

    setConfirmationModal({ isOpen: true, type: "role", index });
  };

  const handleAuthenticatedChange = (e, index) => {
    const updatedUsers = [...editedUsers];
    updatedUsers[index] = {
      ...getUsersForBranch[index],
      authenticated: e.target.value === "true",
    };
    setEditedUsers(updatedUsers);

    setConfirmationModal({ isOpen: true, type: "authenticated", index });
  };

  const handleBranchChange = (e, index) => {
    const updatedUsers = [...editedUsers];
    updatedUsers[index] = {
      ...getUsersForBranch[index],
      branchId: e.target.value,
    };
    setEditedUsers(updatedUsers);

    setConfirmationModal({ isOpen: true, type: "branch", index });
  };

  const applyChanges = () => {
    const { index, type } = confirmationModal;
    const updatedUsers = [...editedUsers];

    if (type === "role") {
      updatedUsers[index] = {
        ...updatedUsers[index],
        role: updatedUsers[index]?.role,
      };
    } else if (type === "authenticated") {
      updatedUsers[index] = {
        ...updatedUsers[index],
        authenticated: updatedUsers[index]?.authenticated,
      };
    } else if (type === "branch") {
      updatedUsers[index] = {
        ...updatedUsers[index],
        branchId: updatedUsers[index]?.branchId,
      };
    }

    setEditedUsers(updatedUsers);

    const userData = updatedUsers[index];
    dispatch(UpdateUser(userData))
      .then(() => {
        setConfirmationModal({ isOpen: false, type: "", index: null });
        fetchBranchUser(userData?.branchId);
      })
      .catch((error) => console.error("Error:", error));
  };

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({ isOpen: false, type: "", index: null });
  };

  const logOut = () => {
    dispatch(logoutUserAsync()).then((res) => {
      if (res.payload.success) {
        navigate("/");
      }
    });
  };

  return (
    <>
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 mt-7 mb-0 mx-2 px-2 md:mx-4 md:px-4 lg:mx-6 lg:px-5 py-6 min-h-screen rounded-lg">
        <div className="header flex flex-wrap justify-between items-center gap-3 pt-4 md:pt-6 mx-2">
          <h1 className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl lg:text-3xl font-medium">
            Shop
          </h1>

          <div className="flex flex-row items-center">
            <button className="custom-button inline-block rounded border border-gray-600 bg-gray-600 px-4 py-2.5 mx-2 text-sm font-medium text-white hover:bg-gray-700 hover:text-gray-100 focus:outline-none active:text-gray-100">
              <Link to={"/dashboard/PendingRequest"}>Pending Request</Link>
            </button>
          </div>
        </div>

        <p className="w-full bg-gray-300 h-px mt-5"></p>

        {loading || selectedShopId === null || pendingloading ? (
          <PageLoader />
        ) : (
          <>
            <div className="tabs flex justify-between items-start my-5">
              <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-4">
                {Shop &&
                  Shop?.map((data) => (
                    <div className="w-full flex items-center gap-3 border border-gray-700 rounded-md p-2">
                      <button
                        onClick={() => fetchBranchUser(data?.id)}
                        className={`border w-56 border-gray-500 ${
                          selectedShopId === data?.id
                            ? "bg-gray-800 text-white border-none"
                            : "bg-white dark:bg-gray-700 text-black hover:bg-gray-800 hover:text-white dark:text-gray-100"
                        } px-5 py-2 mx-2 text-sm rounded-md`}
                        key={data?.id}
                      >
                        {data?.branchName}
                      </button>
                      <IoPencilOutline
                        size={22}
                        className="text-black cursor-pointer  rounded-md"
                        onClick={() => handleEdit(data)}
                      />
                      <IoTrash
                        size={22}
                        className="text-black cursor-pointer  rounded-md"
                        onClick={() => handleDelete(data?.id)}
                      />
                    </div>
                  ))}
              </div>
              <button
                onClick={openModal}
                className="inline-block rounded-sm border border-gray-700 bg-gray-600 p-1.5 hover:bg-gray-700 focus:outline-none active:bg-gray-500 text-white"
              >
                <IoAdd size={28} />
              </button>
            </div>

            <div className="request_list px-3">
              <div className="overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-md shadow-md">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-900 dark:text-gray-200"
                      >
                        <button className="flex items-center gap-x-3 focus:outline-none">
                          <span>Full Name</span>
                        </button>
                      </th>

                      <th
                        scope="col"
                        className="px-12 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-900 dark:text-gray-200"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-12 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-900 dark:text-gray-200"
                      >
                        Role
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-900 dark:text-gray-200"
                      >
                        Authentication Status
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3.5 text-sm font-normal text-left rtl:text-right text-gray-900 dark:text-gray-200"
                      >
                        Branch
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                    {getUsersForBranch.length > 0 ? (
                      getUsersForBranch?.map((data, index) => (
                        <tr key={data?.id}>
                          <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            {data?.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            {data?.email}
                          </td>
                          <td className="px-12 py-4 text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            <ThemedSelect variant="ghost" className="min-w-[9rem]"
                              name="role"
                              value={editedUsers[index]?.role || data?.role}
                              onChange={(e) => handleRoleChange(e, index)}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Superadmin</option>
                            </ThemedSelect>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            <ThemedSelect variant="ghost" className="min-w-[9rem]"
                              name="authenticated"
                              value={
                                editedUsers[index]?.authenticated?.toString() ||
                                data?.authenticated?.toString()
                              }
                              onChange={(e) =>
                                handleAuthenticatedChange(e, index)
                              }
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </ThemedSelect>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            <ThemedSelect variant="ghost" className="min-w-[9rem]"
                              name="branchId"
                              value={
                                editedUsers[index]?.branchId || data?.branchId
                              }
                              onChange={(e) => handleBranchChange(e, index)}
                            >
                              {Shop?.map((shop) => (
                                <option key={shop?.id} value={shop?.id}>
                                  {shop?.branchName}
                                </option>
                              ))}
                            </ThemedSelect>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="flex justify-center items-center mt-4">
                        <td className="text-lg font-semibold text-gray-600 text-center dark:text-gray-300">
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {DeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-50 absolute inset-0"></div>
          <div className="bg-white p-6 rounded-md z-10 dark:bg-gray-700">
            <p className="dark:text-white">
              Are you sure you want to delete this shop?
            </p>
            <div className="my-2 flex items-center text-yellow-600 text-sm">
                <span>
                  <strong>Warning:</strong> You will be logged out.
                </span>
              </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Role/Authentication/Branch Change */}
      {confirmationModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 ">
          <div className="bg-black bg-opacity-50 absolute inset-0"></div>
          <div className="bg-white p-6 rounded-md z-10 dark:bg-gray-700">
            <p className="dark:text-white">
              Are you sure you want to apply the changes?
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeConfirmationModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
              >
                Cancel
              </button>
              <button
                onClick={applyChanges}
                className="px-4 py-2 bg-[#252525] text-white rounded-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create or Update Branch Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-gray-800 opacity-75"
            onClick={closeModal}
          ></div>
          <div className="bg-white w-[95%] max-w-lg p-6 rounded-lg z-50 dark:bg-gray-700">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="branchName"
                  className="block text-sm font-medium text-gray-700 dark:text-white mb-2"
                >
                  Branch Name
                </label>
                <input
                  type="text"
                  name="branchName"
                  placeholder="Enter branch name"
                  value={formData.branchName}
                  onChange={(e) =>
                    setFormData({ ...formData, branchName: e.target.value })
                  }
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  required
                />
              </div>
     
              <div className="my-2 flex items-center text-yellow-600 text-sm">
                <span>
                  <strong>Warning:</strong> You will be logged out.
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-600  text-white rounded-md"
                >
                  {editShop ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Shop;
