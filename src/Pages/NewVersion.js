import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Button, Form, Input } from "antd";
import React, { useEffect, useState } from "react";
import { createUseStyles } from "react-jss";
import { useNavigate, useParams } from "react-router-dom";
import classes from "../App.module.css";
import { createVersion, getMasterIndicators, getVersionDetails, updateVersion } from "../api/api";
import Accordion from "../components/Accordion";
import Card from "../components/Card";
import IndicatorStack from "../components/IndicatorStack";
import Loading from "../components/Loader";
import Modal from "../components/Modal";
import Title from "../components/Title";
import { formatBenchmarkValues, mergeBenchmarks } from "../hooks/controllers/benchmarksController";
import useBenchmarks from "../hooks/useBenchmarks";
import { mergeCategories } from "../utils/helpers";

const useStyles = createUseStyles({
  alertBar: {
    position: "fixed !important",
    top: "3.5rem",
    left: "50%",
    transform: "translateX(-50%)",
  },
  modal: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
  },
  hidden: {
    display: "none",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "flex-end",
    "& button": {
      marginRight: "1rem",
    },
  },
});

export default function NewVersion({ user }) {
  const [loadingIndicators, setLoadingIndicators] = useState(true);
  const [indicators, setIndicators] = useState([]);
  const [availableIndicators, setAvailableIndicators] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [referenceSheet, setReferenceSheet] = useState(null);
  const [selected, setSelected] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);

  const { id } = useParams();
  const navigate = useNavigate();

  const { getDataSet, saveDataValues, dataValues } = useBenchmarks();

  const isView = window.location.href.includes("view");

  const [form] = Form.useForm();

  const styles = useStyles();

  const onFinish = async (values) => {
    try {
      let response;
      if (id) {
        const data = {
          versionDescription: values.versionDescription,
          isPublished: values.isPublished,
          publishedBy: values.isPublished ? user?.me?.username : null,
          indicators: selected,
        };

        response = await updateVersion(id, data);
      } else {
        const data = {
          createdBy: user?.me?.username,
          versionName: values.versionName,
          versionDescription: values.versionDescription,
          isPublished: values.isPublished,
          publishedBy: values.isPublished ? user?.me?.username : null,
          indicators: selected,
        };

        response = await createVersion(data);
      }
      const dataSet = availableIndicators?.[0]?.datasetId;
      await saveDataValues(benchmarks, dataSet);
      if (response) {
        setSuccess("Template saved successfully");
        setError(false);
        window.scrollTo(0, 0);
        setTimeout(() => {
          navigate("/templates/versions");
        }, 1000);
      }
    } catch (error) {
      setError("Oops! Something went wrong");
      setSuccess(false);
    }
  };

  const getIndicatorDetails = async () => {
    try {
      setLoadingIndicators(true);
      const response = await getVersionDetails(id);
      const data = response[0];

      if (data) {
        setReferenceSheet(data?.referenceSheet);

        form.setFieldValue("versionName", data?.versionName);
        form.setFieldValue("versionDescription", data?.versionDescription);
        form.setFieldValue("isPublished", data?.status === "PUBLISHED");

        const indicatorValues = data?.indicators?.map((indicator) => indicator?.indicators?.map((indicator) => indicator.categoryId));

        const flattenedIndicators = indicatorValues?.flat();

        setSelected(flattenedIndicators);

        setLoadingIndicators(false);
      }
    } catch (error) {
      setError("Oops! Something went wrong");
      setLoadingIndicators(false);
    }
  };

  const getIndicators = async () => {
    try {
      setLoadingIndicators(true);
      const res = await getMasterIndicators();

      const data = mergeCategories(res);

      setIndicators(data);
      setLoadingIndicators(false);
    } catch (error) {
      setError("Error loading indicators");
      setLoadingIndicators(false);
    }
  };

  useEffect(() => {
    getIndicators();
    getDataSet();
    if (id) {
      getIndicatorDetails();
    }
    if (!id) {
      form.resetFields();
      setSelected([]);
    }
  }, [id]);

  useEffect(() => {
    if (dataValues && indicators) {
      const mergedIndicators = mergeBenchmarks(indicators, dataValues);
      setBenchmarks(formatBenchmarkValues({}, mergedIndicators));
      setAvailableIndicators(mergedIndicators);
    }
  }, [dataValues, indicators]);

  useEffect(() => {
    if (success) {
      form.resetFields();
      const successTimeout = setTimeout(() => {
        setSuccess(false);
      }, 3000);

      return () => clearTimeout(successTimeout);
    }
  }, [success]);

  const handleCancel = () => {
    form.resetFields();
    navigate("/templates/versions");
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then(() => {
        form.submit();
      })
      .catch((errorInfo) => {
        const error = errorInfo.errorFields[0].name[0];
        const element = document.getElementById(error);
        element.scrollIntoView({ behavior: "smooth" });
      });
  };

  const footer = (
    <div className={styles.cardFooter}>
      <Button name='Small button' onClick={handleCancel} small value='default' className={classes.btnCancel}>
        Cancel
      </Button>
      <Button
        name='Small Primary button'
        onClick={() => {
          form.setFieldValue("isPublished", true);
          handleSubmit();
        }}
        small
        value='default'
        className={classes.btnPublish}
        disabled={selected.length === 0}
      >
        Publish template
      </Button>
      <Button
        name='Small button'
        onClick={() => {
          form.setFieldValue("isPublished", false);
          handleSubmit();
        }}
        small
        value='default'
        className={classes.btnSuccess}
        disabled={selected.length === 0}
      >
        Save
      </Button>
    </div>
  );

  return (
    <Card title='CREATE A VERSION' footer={isView ? null : footer}>
      {success && (
        <Modal open={success} type='success' onCancel={() => setSuccess(false)} title='Success' footer={null}>
          <div className={styles.modal}>
            <CheckCircleIcon className={classes.iconSuccess} />
            {success}
          </div>
        </Modal>
      )}

      {error && (
        <Modal open={error} type='error' onCancel={() => setError(false)} title='Error' footer={null}>
          <div className={styles.modal}>
            <XCircleIcon className={classes.iconError} />
            {error}
          </div>
        </Modal>
      )}

      <Form layout='vertical' form={form} onFinish={onFinish}>
        <Form.Item label='Version Number' className={styles.hidden} name='versionName'>
          <Input placeholder='Version number' disabled />
        </Form.Item>

        <Form.Item name='isPublished' className={styles.hidden}>
          <Input type='checkbox' />
        </Form.Item>

        <Form.Item name='versionDescription' label='Description' rules={[{ required: true, message: "Description is required" }]}>
          <Input.TextArea id='versionDescription' disabled={isView} placeholder='Description' rows={3} />
        </Form.Item>
      </Form>
      <div className={classes.indicatorsSelect}>
        <Title text='SELECT INDICATORS TO ADD' />
        {loadingIndicators ? (
          <Loading type='skeleton' />
        ) : (
          <div className={classes.indicators}>
            {availableIndicators?.map((indicator) => (
              <Accordion key={indicator.categoryName} title={indicator.categoryName}>
                <IndicatorStack
                  disabled={isView}
                  selected={selected}
                  setSelected={setSelected}
                  key={indicator.id}
                  indicator={indicator}
                  isView={isView}
                  referenceSheet={referenceSheet}
                  benchmarks={benchmarks}
                  setBenchmarks={setBenchmarks}
                  saveBenchmark={saveDataValues}
                  orgUnit={user?.me?.organisationUnits[0]?.id}
                />
              </Accordion>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
