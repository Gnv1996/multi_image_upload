import {
  Box,
  Card,
  CircularProgress,
  FormControl,
  Modal,
  Stack,
  TextField,
  TextareaAutosize,
  Typography,
} from "@mui/material";
import CustomButton from "../../components/ui/CustomButton";
import UploadDocsTable from "../../components/viewRegistration/UploadDocsTable";
import { useContext, useEffect, useRef, useState } from "react";
import PartsTableView from "../../components/viewRegistration/PartTableView";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useLocation, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import CreateClaim from "../../components/createClaim/CreateClaim";
import Cookies from "js-cookie";
import { MyContext } from "../../context/ContextProvider";
import CommonSelect from "../../components/Common/CommonSelect";
import RevsTable from "../../components/createClaim/RevsTable";
import BackspaceIcon from "@mui/icons-material/Backspace";
import ClaimsTable from "../../components/createClaim/ClaimsTable";
import { jwtDecode } from "jwt-decode";
import { Details } from "@mui/icons-material";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import IconButton from "@mui/material/IconButton";

const optionData = [
  { id: 1, value: "FREEZE DAMAGE" },
  { id: 2, value: "DIMPLE LEAK REV ONLY" },
  { id: 3, value: "HEADER LEAK" },
  { id: 4, value: "PANEL LEAK" },
  { id: 5, value: "PANEL SPLIT" },
  { id: 6, value: "PANEL TOO LONG" },
  { id: 7, value: "PANEL TOO SHORT" },
  { id: 8, value: "VRV FAIL" },
];
const optionDataAction = [
  { id: 1, value: "Repair" },
  { id: 2, value: "Replace" },
];

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 10,
  p: 4,
  borderRadius: "10px",
  margin: "auto",
};
const styles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",

  bgcolor: "background.paper",
  boxShadow: 10,
  p: 4,
  borderRadius: "10px",
  margin: "auto",
};

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box padding={{ xs: 1, sm: 3 }}>
          <ToastContainer />
          <Box>{children}</Box>
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function ViewRegistration() {
  const { id } = useParams();
  const { partsData, deletePart, setDeletePart } = useContext(MyContext);
  const token = Cookies.get("token");
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const [docDetails, setDocDetails] = useState([]);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [allFormData, setAllFormData] = useState("");
  const [uploadState, setUploadState] = useState({
    uploadInput: null,
  });
  const [uploadDocState, setUploadDocState] = useState({ uploadInput: null });
  const [uploadClaimImageList, setUploadClaimImageList] = useState([]);
  const [uploadDocEditState, setUploadDocEditState] = useState({
    uploadInput: null,
  });
  const [editDocDetails, setEditDocDetails] = useState(null);
  const [formValues, setFormValues] = useState({
    repairDate: "",
    action_id: "",
    problem_id: "",
    barcode: "",
    uploadFile: null,
    uploadList: "",
    comment: "",
  });
  const [claimedPartData, setClaimedPartData] = useState([]);
  const [claimsData, setClaimsData] = useState([]);
  const [openEditDoc, setOpenEditDoc] = useState(false);
  const [openViewDoc, setOpenViewDoc] = useState(false);
  const [openClaimDoc, setOpenClaimDoc] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [addPartLoading, setAddPartLoading] = useState(false);
  const [showSubmit, setShowSubmit] = useState(true);
  const [imageData, setImageData] = useState(null);
  const [claimImageData, setClaimImageData] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (uploadState.uploadInput !== null) {
      if (uploadFileList.includes(uploadState.uploadInput.name)) {
        return;
      } else {
        setUploadFileList([...uploadFileList, uploadState.uploadInput.name]);
      }
      fileInputRef.current.value = "";
    }
  }, [uploadState]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  useEffect(() => {
    if (uploadState.uploadInput !== null) {
      const file = uploadState.uploadInput;

      if (file && file.type?.startsWith("image/")) {
        if (!uploadClaimImageList.some((img) => img.name === file.name)) {
          setUploadClaimImageList((prevList) => [...prevList, file]);
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [uploadState]);

  useEffect(() => {
    getDocumentData();
    getClaimedPart();
  }, [deletePart]);

  const handleSubmitFile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = {
        document_note: uploadState.uploadFile,
        document: uploadState.uploadInput,
      };

      const res = await axiosInstance.post(`api/claims/claim/`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status == 200) {
        toast.success("Document Uploaded", { autoClose: 2000 });
        setUploadState({
          uploadInput: null,
          commentInput: "",
        });
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = (e) => {
    const { value } = e.target;
    setUploadDocState((prevState) => ({
      ...prevState,
      commentInput: value,
    }));
  };

  const handleFileUploadChangeShowParts = (e) => {
    setUploadState((prevState) => ({
      ...prevState,
      uploadInput: e.target.files[0],
    }));
    e.target.value = null;
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = null;
    }
  };

  const getClaimedPart = async () => {
    setTableLoading(true);
    try {
      const response = await axiosInstance.get(
        `api/claims/retrieve-claims/${id}/`
      );
      if (response.status == 200) {
        const data1 = await response.data.claims.map((detail, i) => {
          const data = {
            action: optionDataAction[detail?.action - 1]?.value,
            problem: optionData[detail?.problem - 1]?.value,
            part_id: detail?.part_id,
            regid: detail?.regid,
            ramid: detail?.ramid,
            status: detail?.status,
            add_comment: detail?.add_comment,
            // documents:detail?.documents?.[0]
            documents: detail?.documents || [],
          };
          return data;
        });
        console.log(data1, "====working fine");
        setClaimsData(data1);
      }
    } catch (error) {
      setClaimsData("");
      throw new Error("Failed to submit claim. Please try again later.");
    }
    setTableLoading(false);
    setDeletePart(false);
  };

  

  const handleAddPart = () => {
    if (formValues.action_id !== "" && formValues.problem_id !== "") {
      const partData = new FormData();
      partData.append("part_id", selectedPart.id);
      partData.append("repair_date", formValues.repairDate);
      partData.append("claim_action", formValues.action_id);
      partData.append("part_problem", formValues.problem_id);
      for (let i = 0; i < uploadClaimImageList.length; i++) {
        partData.append("documents", uploadClaimImageList[i]);
      }
      partData.append("add_comment", formValues.comment);
      partData.append("profile", id);

      const element = document.getElementsByClassName(
        "css-cdprif-MuiButtonBase-root-MuiButton-root"
      );
      if (element.length > 0) {
        const elements = element[0];
        elements.click();
      }
      setAllFormData(partData);
      AddPartApi(partData);
      setSelectedPart(null);
      setUploadFileList([]);
      setUploadState({
        uploadInput: null,
      });
      setFormValues({
        repairDate: "",
        action_id: "",
        problem_id: "",
        barcode: "",
        uploadFile: null,
        uploadList: "",
        comment: "",
      });
    } else {
      errorField();
    }
  };

  const AddPartApi = async (data) => {
    try {
      setAddPartLoading(true);
      const res = await axiosInstance.post(`api/claims/add-part/`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.status == 201) {
        setShowSubmit(false);
        toast.success("Part Uploaded", { autoClose: 2000 });
        const data = {
          Action: optionDataAction[res.data.claim_action - 1].value,
          Problem: optionData[res.data.part_problem - 1].value,
          PartId: res.data.part_id,
          Part: res.data.part_number,
          regid: res.data.regid,
          ramid: res.data.ramid_id,
          status: res.data.status,
        };
        setClaimedPartData([...claimedPartData, data]);
        setSelectedPart(null);
      }
    } catch (error) {
      toast.error(error.response.data.error, { autoClose: 2000 });
      console.log("Error:", error);
    } finally {
      setAddPartLoading(false);
    }
  };



  const handleClose = () => {
    setOpenEditDoc(false);
    setEditDocDetails(null);
  };

  const fetchImage = async (data) => {
    setImageLoading(true);
    try {
      const response = await axiosInstance.get(data, {
        responseType: "blob",
      });

      if (data.includes(".pdf")) {
        const url = URL.createObjectURL(response.data);
        window.open(url);
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(response.data);

        reader.onloadend = () => {
          setImageData(reader.result);
        };
      }
    } catch (error) {
      console.error("Error fetching image:", error);
    }
    setImageLoading(false);
  };

  const fetchImages = async (urls) => {
    setImageLoading(true);
    try {
      const imagePromises = urls.map(async (url) => {
        const response = await axiosInstance.get(url, { responseType: "blob" });

        if (url.endsWith(".pdf")) {
          // Handle PDFs
          const pdfUrl = URL.createObjectURL(response.data);
          window.open(pdfUrl);
          return null;
        } else {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(response.data);
          });
        }
      });

      const imageDataArray = await Promise.all(imagePromises);
      setClaimImageData(imageDataArray.filter((data) => data !== null)); // Filter out null values for PDFs
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleViewParts = (data) => {
    fetchImage(data.document);
    if (data.document.includes(".pdf")) {
      setOpenViewDoc(false);
    } else {
      setOpenViewDoc(true);
    }
  };

  const handleClaimViewParts = (data) => {
    fetchImages(data.documents);
    if (data.documents.includes(".pdf")) {
      setOpenClaimDoc(false);
    } else {
      setOpenClaimDoc(true);
    }
  };

  const handleViewClose = () => {
    setOpenViewDoc(false);
    setEditDocDetails(null);
    setImageData(null);
    setClaimImageData(null);
  };

  const handleClaimClose = () => {
    setOpenClaimDoc(false);
    setImageData(null);
    setClaimImageData(null);
  };

  return (
    <Box
      sx={{ display: "flex", justifyContent: "center", width: "100%" }}
      my={2}
    >
      <Card
        sx={{
          width: "100%",
          margin: "15px",
          padding: "20px",
          boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
        }}
      >
        

        <Box sx={{ width: "100%" }}>
     
          <CustomTabPanel value={value} index={0}>
            <CreateClaim />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <Card
              sx={{
                boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
                marginBottom: "20px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  bgcolor: "#1976D2",
                  color: "white",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >
                <Typography>Pool - Upload POP Docs</Typography>
              </Box>
              <Box margin={3}>
                <Box sx={{ overflow: "auto" }}>
                  {tableLoading ? (
                    <Box textAlign={"center"}>
                      <CircularProgress size={"1rem"} />
                    </Box>
                  ) : (
                    <UploadDocsTable
                      data={docDetails}
                      handleEditParts={handleEditParts}
                      handleViewParts={handleViewParts}
                    />
                  )}
                </Box>
                <form onSubmit={handleSubmit}>
                  <Box width={"400px"}>
                    <Box my={2}>
                      <TextField
                        type="file"
                        ref={fileInputRef}
                        size="small"
                        onChange={handleFileUploadChange}
                      />
                    </Box>
                    <Box display={"flex"} alignItems={"center"} gap={1}>
                      <Typography>Comment:</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Enter document name"
                        value={uploadDocState.commentInput}
                        onChange={handleUploadChange}
                      />
                      <CustomButton
                        buttonName={"Upload"}
                        type={"submit"}
                        variant={"contained"}
                        loading={loading}
                      />
                    </Box>
                  </Box>
                </form>
              </Box>
              <Modal
                open={openEditDoc}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={style}>
                  <form onSubmit={handleSubmit}>
                    <Box my={2}>
                      <Box gap={1} my={2}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "gray",
                          }}
                        >
                          Upload Doc:
                        </Typography>
                        <TextField
                          type="file"
                          ref={fileInputRef}
                          size="small"
                          onChange={handleFileUploadEditChange}
                        />
                      </Box>
                      <Box gap={1}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "gray",
                          }}
                        >
                          Comment:
                        </Typography>
                        <TextField
                          style={{ width: "100%" }}
                          size="small"
                          placeholder="Enter document name"
                          value={uploadDocEditState.commentInput}
                          onChange={handleUploadEditChange}
                        />
                      </Box>
                    </Box>
                  </form>
                  <Box display={"flex"} justifyContent={"end"} gap={2}>
                    <CustomButton buttonName={"Cancel"} onClick={handleClose} />
                    <CustomButton
                      buttonName={"update"}
                      onClick={handleUpdateDocPool}
                    />
                  </Box>
                </Box>
              </Modal>
              <Modal
                open={openViewDoc}
                onClose={handleViewClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={styles}>
                  <Box my={2}>
                    <Box my={2}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "gray",
                        }}
                      >
                        Preview the Doc:
                      </Typography>
                      <Box>
                        {imageLoading ? (
                          <Box textAlign={"center"}>
                            <CircularProgress size={"1rem"} />
                          </Box>
                        ) : (
                          <img src={imageData} alt="doc" width={"100%"} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box display={"flex"} justifyContent={"center"} gap={2}>
                    <CustomButton
                      buttonName={"Close"}
                      onClick={handleViewClose}
                    />
                  </Box>
                </Box>
              </Modal>
            </Card>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <Card
              sx={{
                boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
                marginBottom: "20px",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  bgcolor: "#1976D2",
                  color: "white",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >
                <Typography>Pool Parts</Typography>
              </Box>
              <Box sx={{ overflow: "auto" }} margin={3}>
                <Stack
                  my={2}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1, sm: 2, md: 4 }}
                  alignItems={{ sm: "center" }}
                  width={{ xs: "100%", sm: "50%" }}
                >
                  <Typography pb={"3px"} fontWeight={"bold"} color={"gray"}>
                    Enter Repair Date:
                  </Typography>
                  <TextField
                    type="date"
                    name="repairDate"
                    size="small"
                    value={formValues.repairDate}
                    onChange={(e) => handleInputChange(e, "repairDate")}
                  />
                </Stack>
                <Typography pb={"3px"} fontWeight={"bold"} color={"gray"}>
                  Choose Part:
                </Typography>
                <PartsTableView
                  data={partsData}
                  setSelectedPart={setSelectedPart}
                />
                {partsData.length > 0 && (
                  <>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 1, sm: 2, md: 4 }}
                      my={4}
                    >
                      <Box>
                        <Typography
                          pb={"3px"}
                          fontWeight={"bold"}
                          color={"gray"}
                        >
                          <span style={{ color: "red" }}>*</span>Action:
                        </Typography>
                        <CommonSelect
                          name={"action_id"}
                          value={formValues.action_id}
                          disabled={selectedPart == null}
                          placeholder={"Select Action"}
                          onChange={(e) => handleInputChange(e, "action_id")}
                          options={optionDataAction.map((option) => ({
                            value: option.id,
                            label: option.value,
                          }))}
                        />
                      </Box>
                      <Box>
                        <Typography
                          pb={"3px"}
                          fontWeight={"bold"}
                          color={"gray"}
                        >
                          <span style={{ color: "red" }}>*</span>Problem:
                        </Typography>
                        <CommonSelect
                          name={"problem_id"}
                          value={formValues.problem_id}
                          disabled={selectedPart == null}
                          placeholder={"Select Problem"}
                          onChange={(e) => handleInputChange(e, "problem_id")}
                          options={optionData.map((option) => ({
                            value: option.id,
                            label: option.value,
                          }))}
                        />
                      </Box>
                      <Box>
                        <Typography
                          pb={"3px"}
                          fontWeight={"bold"}
                          color={"gray"}
                        >
                          Barcode:
                        </Typography>
                        <TextField
                          size="small"
                          name="barcode"
                          readOnly
                          placeholder="Barcode"
                          value={formValues.barcode}
                        />
                      </Box>
                      <Box>
                        <Typography
                          pb={"3px"}
                          fontWeight={"bold"}
                          color={"gray"}
                        >
                          You can add pictures as needed for each part you are
                          claiming here:
                        </Typography>
                        <form onSubmit={handleSubmitFile}>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap" }}
                            gap={2}
                          >
                            <FormControl>
                              <TextField
                                size="small"
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileUploadChangeShowParts}
                              />
                            </FormControl>
                          </Box>
                        </form>
                      </Box>
                    </Stack>
                    <Stack
                      width={"100%"}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 1, sm: 2, md: 4 }}
                    >
                      <Box width={"100%"}>
                        <Typography
                          pb={"3px"}
                          fontWeight={"bold"}
                          color={"gray"}
                        >
                          Add Comment:
                        </Typography>
                        <TextareaAutosize
                          aria-label="minimum height"
                          minRows={3}
                          style={{
                            width: "100%",
                            border: "1px solid gray",
                            borderRadius: "5px",
                            padding: "4px",
                          }}
                          placeholder="Add comment ..."
                          name="comment"
                          value={formValues.comment}
                          onChange={(e) => handleInputChange(e, "comment")}
                        />
                      </Box>

                      <Box width={"100%"}>
                        <Typography
                          pb={"3px"}
                          fontWeight={"bold"}
                          color={"gray"}
                        >
                          Uploaded File List:
                        </Typography>
                        <Box
                          style={{
                            width: "100%",
                            border: "1px solid gray",
                            borderRadius: "5px",
                            padding: "4px",
                            height: "80px",
                            overflowY: "auto",
                            overflowX: "hidden",
                            display: "flex",
                            flexWrap: "wrap",
                          }}
                        >
                          {uploadFileList?.map((ele, index) => (
                            <Box
                              key={index}
                              display={"flex"}
                              gap={1}
                              m={1}
                              alignItems={"center"}
                            >
                              <Box>
                                <Typography
                                  fontSize={"12px"}
                                  fontWeight={"bold"}
                                  border={"1px solid gray"}
                                  borderRadius={"5px"}
                                  my={1}
                                  width={"max-content"}
                                  py={"1px"}
                                  px={1}
                                >
                                  {ele}
                                </Typography>
                              </Box>
                              <BackspaceIcon
                                fontSize="small"
                                sx={{ "&:hover": { cursor: "pointer" } }}
                                onClick={() => handleDelete(ele)}
                              />
                            </Box>
                          ))}
                        </Box>

                        <Box
                          sx={{ display: "flex", justifyContent: "end" }}
                          my={2}
                        >
                          <CustomButton
                            buttonName={"Add Part"}
                            variant="contained"
                            disable={selectedPart === null}
                            onClick={handleAddPart}
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </>
                )}
                <Box sx={{ overflow: "auto" }} mb={4}>
                  <Typography pb={"3px"} fontWeight={"bold"} color={"#4a4d4a"}>
                    *Claimed Part
                  </Typography>
                  {addPartLoading ? (
                    <Box textAlign={"center"}>
                      <CircularProgress size={"1rem"} />
                    </Box>
                  ) : (
                    <RevsTable data={claimedPartData} />
                  )}
                </Box>

                <Box width={"100%"}>
                  <Box sx={{ display: "flex", justifyContent: "end" }} my={2}>
                    <CustomButton
                      buttonName="Submit Claim"
                      variant="contained"
                      disable={showSubmit}
                      onClick={submitClaim}
                    />
                  </Box>
                </Box>
              </Box>
            </Card>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={3}>
            <Box sx={{ overflow: "auto" }} mb={4}>
              <Typography pb={"3px"} fontWeight={"bold"} color={"#4a4d4a"}>
                *Claims
              </Typography>
              {tableLoading ? (
                <Box textAlign={"center"}>
                  <CircularProgress size={"1rem"} />
                </Box>
              ) : (
                <ClaimsTable
                  data={claimsData}
                  handleClaimViewParts={handleClaimViewParts}
                />
              )}
            </Box>
            <Modal
              open={openClaimDoc}
              onClose={handleClaimClose}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: "60%",
                  maxWidth: "800px",
                  height: "70%",
                  maxHeight: "600px",
                  position: "relative",
                  overflow: "hidden",
                  bgcolor: "background.paper",
                  borderRadius: "8px",
                  boxShadow: 24,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "text.primary",
                    mb: 2,
                  }}
                >
                  Preview the Docs:
                </Typography>
                <Box position="relative" flexGrow={1}>
                  {imageLoading ? (
                    <Box textAlign={"center"}>
                      <CircularProgress size={"2rem"} />
                    </Box>
                  ) : claimImageData && claimImageData.length > 0 ? (
                    <Carousel
                      selectedItem={currentIndex}
                      showThumbs={false}
                      showStatus={false}
                      infiniteLoop
                      autoPlay
                      interval={3000}
                      stopOnHover
                      onChange={(index) => setCurrentIndex(index)}
                      renderArrowPrev={(onClickHandler, hasPrev, label) =>
                        hasPrev && (
                          <IconButton
                            onClick={onClickHandler}
                            title={label}
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "10px",
                              transform: "translateY(-50%)",
                              zIndex: 2,
                              background: "rgba(0, 0, 0, 0.5)",
                              borderRadius: "50%",
                              color: "white",
                              padding: "8px",
                              "&:hover": {
                                background: "rgba(0, 0, 0, 0.7)",
                              },
                            }}
                          >
                            <ArrowBackIos fontSize="medium" />
                          </IconButton>
                        )
                      }
                      renderArrowNext={(onClickHandler, hasNext, label) =>
                        hasNext && (
                          <IconButton
                            onClick={onClickHandler}
                            title={label}
                            sx={{
                              position: "absolute",
                              top: "50%",
                              right: "10px",
                              transform: "translateY(-50%)",
                              zIndex: 2,
                              background: "rgba(0, 0, 0, 0.5)",
                              borderRadius: "50%",
                              color: "white",
                              padding: "8px",
                              "&:hover": {
                                background: "rgba(0, 0, 0, 0.7)",
                              },
                            }}
                          >
                            <ArrowForwardIos fontSize="medium" />
                          </IconButton>
                        )
                      }
                    >
                      {claimImageData.map((image, index) => (
                        <div key={index} style={{ position: "relative" }}>
                          <img
                            src={image}
                            alt={`doc-${index}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              maxHeight: "500px",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>
                      ))}
                    </Carousel>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No images available.
                    </Typography>
                  )}
                </Box>
                <Box mt={2} display="flex" overflow="auto" sx={{ pb: 1 }}>
                  {claimImageData && claimImageData.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {claimImageData.map((image, index) => (
                        <IconButton
                          key={index}
                          onClick={() => handleThumbnailClick(index)}
                          sx={{
                            p: 0,
                            borderRadius: "4px",
                            border:
                              currentIndex === index
                                ? "2px solid blue"
                                : "2px solid transparent",
                            "&:hover": {
                              border: "2px solid blue",
                            },
                            "& img": {
                              width: "80px",
                              height: "60px",
                              objectFit: "cover",
                            },
                          }}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index}`}
                            style={{ borderRadius: "4px" }}
                          />
                        </IconButton>
                      ))}
                    </Box>
                  )}
                </Box>
                <Box display={"flex"} justifyContent={"center"} mt={2}>
                  <CustomButton
                    buttonName={"Close"}
                    onClick={handleClaimClose}
                  />
                </Box>
              </Box>
            </Modal>
          </CustomTabPanel>
        </Box>
      </Card>
    </Box>
  );
}
