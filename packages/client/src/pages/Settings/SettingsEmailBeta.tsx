import { ReactNode, useEffect, useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import SaveSettings from "components/SaveSettings";
import { RadioGroup } from "@headlessui/react";
import ApiService from "services/api.service";
import { Input } from "components/Elements";
import { toast } from "react-toastify";
import { setDomainsList, setSettingsPrivateApiKey } from "reducers/settings";
import { useDispatch } from "react-redux";

const memoryOptions: Record<
  string,
  { id: string; name: string; inStock: boolean }
> = {
  free3: { id: "free3", name: "Free3", inStock: true },
  mailgun: { id: "mailgun", name: "Mailgun", inStock: true },
  sendgrid: { id: "sendgrid", name: "Sendgrid", inStock: true },
  mailchimp: { id: "mailchimp", name: "Mailchimp", inStock: false },
  smtp: { id: "smtp", name: "SMTP", inStock: false },
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsEmailBeta() {
  const [emailProvider, setEmailProvider] = useState("");
  const [verified, setVerified] = useState(false);
  const mem = memoryOptions[emailProvider];

  const [formData, setFormData] = useState({
    mailgunAPIKey: "",
    sendingDomain: "",
    sendingName: "",
    sendingEmail: "",
    testSendingName: "",
    testSendingEmail: "",
    sendgridApiKey: "",
    sendgridFromEmail: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({
    mailgunAPIKey: [],
    sendingDomain: [],
    sendingName: [],
    sendingEmail: [],
    testSendingName: [],
    testSendingEmail: [],
    sendgridApiKey: [],
    sendgridFromEmail: [],
  });

  const [possibleDomains, setPossibleDomains] = useState<string[]>([]);

  const dispatch = useDispatch();
  const callDomains = async () => {
    if (formData.mailgunAPIKey) {
      dispatch(setSettingsPrivateApiKey(formData.mailgunAPIKey));
      const response = await dispatch(setDomainsList(formData.mailgunAPIKey));
      if (response?.data) {
        setPossibleDomains(response?.data?.map((item: any) => item.name) || []);
      }
    }
  };

  const [showErrors, setShowErrors] = useState({
    mailgunAPIKey: false,
    sendingDomain: false,
    sendingName: false,
    sendingEmail: false,
    testSendingName: false,
    testSendingEmail: false,
    sendgridApiKey: false,
    sendgridFromEmail: false,
  });

  useEffect(() => {
    const newErrors: { [key: string]: string[] } = {
      mailgunAPIKey: [],
      sendingDomain: [],
      sendingName: [],
      sendingEmail: [],
      testSendingName: [],
      testSendingEmail: [],
      sendgridApiKey: [],
      sendgridFromEmail: [],
    };

    if (!formData.mailgunAPIKey)
      newErrors.mailgunAPIKey.push("API key should be provided");

    if (!formData.sendingName)
      newErrors.sendingName.push("Sending name should be provided");

    if (
      !`${formData.sendingEmail}@laudspeaker.com`.match(
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
      )
    )
      newErrors.sendingEmail.push("Email should be valid");

    setErrors(newErrors);
  }, [formData]);

  const isError =
    emailProvider === "mailgun" &&
    Object.values(errors).some((arr) => arr.length > 0);

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const {
        mailgunAPIKey,
        sendingDomain,
        sendingName,
        sendingEmail,
        testSendingEmail,
        testSendingName,
        emailProvider: provider,
        verified: verifiedFromRequest,
        sendgridApiKey,
        sendgridFromEmail,
      } = data;
      setFormData({
        mailgunAPIKey: mailgunAPIKey || "",
        sendingDomain: sendingDomain || "",
        sendingName: sendingName || "",
        sendingEmail: sendingEmail || "",
        testSendingEmail: testSendingEmail || "",
        testSendingName: testSendingName || "",
        sendgridApiKey: sendgridApiKey || "",
        sendgridFromEmail: sendgridFromEmail || "",
      });
      setEmailProvider(provider);
      setVerified(verifiedFromRequest);
    })();
  }, []);

  const handleFormDataChange = (e: any) => {
    console.log(e.target.name, e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: any) => {
    setShowErrors({ ...showErrors, [e.target.name]: true });
  };

  const handleSubmit = async () => {
    try {
      const objToSend: Record<string, any> = {};
      for (const key of Object.keys(formData)) {
        if ((formData as Record<string, any>)[key])
          objToSend[key] = (formData as Record<string, any>)[key];
      }
      await ApiService.patch({
        url: "/accounts",
        options: { ...objToSend, emailProvider },
      });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Unexpected error", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const configuration: Record<string, ReactNode> = {
    mailgun: (
      <>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">Mailgun API Key</dt>
          <dd>
            <div className="relative rounded-md ">
              <Input
                type="password"
                value={formData.mailgunAPIKey}
                onChange={handleFormDataChange}
                name="mailgunAPIKey"
                id="mailgunAPIKey"
                className={classNames(
                  errors.mailgunAPIKey.length > 0 && showErrors.mailgunAPIKey
                    ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                    : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                )}
                aria-invalid="true"
                aria-describedby="password-error"
                onBlur={(e: any) => {
                  handleBlur(e);
                  callDomains();
                }}
              />
              {showErrors.mailgunAPIKey && errors.mailgunAPIKey.length > 0 && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {showErrors.mailgunAPIKey &&
              errors.mailgunAPIKey.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">Sending Domain</dt>
          <dd>
            <div className="relative rounded-md">
              <select
                id="sendingDomain"
                name="sendingDomain"
                disabled={
                  !formData.mailgunAPIKey || possibleDomains.length === 0
                }
                value={formData.sendingDomain}
                onChange={handleFormDataChange}
                className={`mt-1 block w-full rounded-md py-2 pl-3 pr-10 text-base focus:outline-none sm:text-sm ${
                  errors.sendingDomain.length > 0 && showErrors.sendingDomain
                    ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                    : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                onBlur={handleBlur}
              >
                <option value={formData.sendingDomain}>
                  {formData.sendingDomain}
                </option>
                {possibleDomains.map((item) => (
                  <option value={item}>{item}</option>
                ))}
              </select>
              {showErrors.sendingDomain && errors.sendingDomain.length > 0 && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {showErrors.sendingDomain &&
              errors.sendingDomain.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">Sending Name</dt>
          <dd>
            <div className="relative rounded-md">
              <Input
                type="text"
                value={formData.sendingName}
                onChange={handleFormDataChange}
                name="sendingName"
                id="sendingName"
                className={`rounded-md shadow-sm sm:text-sm ${
                  showErrors.sendingName && errors.sendingName.length > 0
                    ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                    : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                placeholder="Team Laudspeaker"
                onBlur={handleBlur}
              />
              {showErrors.sendingName && errors.sendingName.length > 0 && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {showErrors.sendingName &&
              errors.sendingName.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">Sending Email</dt>
          <dd>
            <div className="relative mt-1 rounded-md shadow-sm">
              <Input
                type="text"
                value={formData.sendingEmail}
                onChange={handleFormDataChange}
                name="sendingEmail"
                id="sendingEmail"
                className={`rounded-md shadow-sm sm:text-sm pr-[150px] ${
                  showErrors.sendingEmail && errors.sendingEmail.length > 0
                    ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                    : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                placeholder="noreply"
                onBlur={handleBlur}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  @laudspeaker.com
                </span>
              </div>
              {showErrors.sendingEmail && errors.sendingEmail.length > 0 && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {showErrors.sendingEmail &&
              errors.sendingEmail.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
      </>
    ),
    free3: (
      <>
        {!verified && (
          <>
            <div className="text-red-500">You need to verify your email!</div>
          </>
        )}
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">Sending Name</dt>
          <dd>
            <div className="relative rounded-md">
              <Input
                type="text"
                value={formData.testSendingName}
                onChange={handleFormDataChange}
                name="testSendingName"
                id="testSendingName"
                className={`rounded-md shadow-sm sm:text-sm ${
                  showErrors.testSendingName &&
                  errors.testSendingName.length > 0
                    ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                    : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                placeholder="Team Laudspeaker"
                onBlur={handleBlur}
                disabled={!verified}
              />
              {showErrors.testSendingName && errors.testSendingName.length > 0 && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {showErrors.testSendingName &&
              errors.testSendingName.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">Sending Email</dt>
          <dd>
            <div className="relative mt-1 rounded-md shadow-sm">
              <Input
                type="text"
                value={formData.testSendingEmail}
                onChange={handleFormDataChange}
                name="testSendingEmail"
                id="testSendingEmail"
                className={`rounded-md shadow-sm sm:text-sm pr-[150px] ${
                  showErrors.testSendingEmail &&
                  errors.testSendingEmail.length > 0
                    ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                    : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                placeholder="noreply"
                onBlur={handleBlur}
                disabled={!verified}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  @laudspeaker.com
                </span>
              </div>
              {showErrors.testSendingEmail &&
                errors.testSendingEmail.length > 0 && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
            </div>
            {showErrors.testSendingEmail &&
              errors.testSendingEmail.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
      </>
    ),
    sendgrid: (
      <>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">
            Sendgrid Api key
          </dt>
          <dd>
            <div className="relative rounded-md">
              <Input
                type="password"
                value={formData.sendgridApiKey}
                onChange={handleFormDataChange}
                name="sendgridApiKey"
                id="sendgridApiKey"
                className={`rounded-md shadow-sm sm:text-sm ${
                  showErrors.sendgridApiKey && errors.sendgridApiKey.length > 0
                    ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                    : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                placeholder="****"
                onBlur={handleBlur}
              />
              {showErrors.sendgridApiKey && errors.sendgridApiKey.length > 0 && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {showErrors.sendgridApiKey &&
              errors.sendgridApiKey.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
          <dt className="text-sm font-medium text-gray-500">Sendgrid email</dt>
          <dd>
            <div className="relative mt-1 rounded-md shadow-sm">
              <Input
                type="text"
                value={formData.sendgridFromEmail}
                onChange={handleFormDataChange}
                name="sendgridFromEmail"
                id="sendgridFromEmail"
                className={`rounded-md shadow-sm sm:text-sm ${
                  showErrors.sendgridFromEmail &&
                  errors.sendgridFromEmail.length > 0
                    ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                    : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                placeholder="your.email@sendgrid.com"
                onBlur={handleBlur}
              />
              {showErrors.sendgridFromEmail &&
                errors.sendgridFromEmail.length > 0 && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
            </div>
            {showErrors.sendgridFromEmail &&
              errors.sendgridFromEmail.map((item) => (
                <p
                  className="mt-2 text-sm text-red-600"
                  id="email-error"
                  key={item}
                >
                  {item}
                </p>
              ))}
          </dd>
        </div>
      </>
    ),
  };

  return (
    <>
      <div className="mt-10">
        <div className="space-y-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Select Your Email Provider
          </h3>
          <p className="max-w-2xl text-sm text-gray-500">
            For instructions on where to find these values, please see our
            documentation.
          </p>
        </div>
        <div className="space-y-10">
          <div className="flex items-center justify-between"></div>

          <RadioGroup
            value={mem}
            onChange={(m: any) => setEmailProvider(m.id)}
            className="mt-2"
          >
            <RadioGroup.Label className="sr-only">
              Choose a memory option
            </RadioGroup.Label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Object.values(memoryOptions).map((option) => (
                <RadioGroup.Option
                  key={option.name}
                  value={option}
                  className={({ active, checked }) =>
                    classNames(
                      option.inStock
                        ? "cursor-pointer focus:outline-none"
                        : "opacity-25 cursor-not-allowed",
                      active ? "ring-2 ring-offset-2 ring-cyan-500" : "",
                      checked
                        ? "bg-cyan-600 border-transparent text-white hover:bg-cyan-700"
                        : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
                      "border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium sm:flex-1"
                    )
                  }
                  disabled={!option.inStock}
                >
                  <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>
        </div>
        <div className="mt-6">
          <dl className="divide-y divide-gray-200">
            {configuration[emailProvider]}
            <SaveSettings
              disabled={isError || (!verified && emailProvider === "free3")}
              onClick={handleSubmit}
            />
          </dl>
        </div>
      </div>
    </>
  );
}
