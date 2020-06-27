import React, {
  useState,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";

import htmlContent from "./h5/html";
import injectedSignaturePad from "./h5/js/signature_pad";
import injectedApplication from "./h5/js/app";

import { WebView } from "react-native-webview";

const styles = StyleSheet.create({
  webBg: {
    width: "100%",
    backgroundColor: "#FFF",
    flex: 1,
  },
  loadingOverlayContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});

const SignatureView = forwardRef(
  (
    {
      webStyle = "",
      onOK = () => {},
      onEmpty = () => {},
      onClear = () => {},
      onBegin = () => {},
      onEnd = () => {},
      descriptionText = "Sign above",
      clearText = "Clear",
      confirmText = "Confirm",
      customHtml = null,
      autoClear = false,
      imageType = "",
      dataURL = "",
      penColor = "black",
      strokeWidth = { min: 0.5, max: 2.5 },
    },
    ref
  ) => {
    const [loading, setLoading] = useState(true);
    const webViewRef = useRef();
    const source = useMemo(() => {
      let injectedJavaScript = injectedSignaturePad + injectedApplication;
      const htmlContentValue = customHtml ? customHtml : htmlContent;
      injectedJavaScript = injectedJavaScript.replace(
        "<%autoClear%>",
        autoClear
      );
      injectedJavaScript = injectedJavaScript.replace(
        "<%imageType%>",
        imageType
      );
      injectedJavaScript = injectedJavaScript.replace("<%dataURL%>", dataURL);

      let html = htmlContentValue(injectedJavaScript);
      html = html.replace("<%style%>", webStyle);
      html = html.replace("<%description%>", descriptionText);
      html = html.replace("<%confirm%>", confirmText);
      html = html.replace("<%clear%>", clearText);

      return { html };
    }, [
      customHtml,
      autoClear,
      imageType,
      webStyle,
      descriptionText,
      confirmText,
      clearText,
    ]);

    const getSignature = (e) => {
      switch (e.nativeEvent.data) {
        case "BEGIN":
          onBegin();
          break;
        case "END":
          onEnd();
          break;
        case "EMPTY":
          onEmpty();
          break;
        case "CLEAR":
          onClear();
          break;
        default:
          onOK(e.nativeEvent.data);
      }
    };

    useEffect(() => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `changePenColor('${penColor}');true;`
        );
      }
    }, [penColor]);

    useEffect(() => {
      if (webViewRef.current) {
        const { min, max } = strokeWidth;
        webViewRef.current.injectJavaScript(
          `changeStrokeWidth(${min}, ${max});true;`
        );
      }
    }, [strokeWidth]);

    useEffect(() => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          "setBackgroundImage('" + dataURL + "');true;"
        );
      }
    }, [dataURL]);

    useImperativeHandle(
      ref,
      () => ({
        readSignature: () => {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript("readSignature();true;");
          }
        },
        clearSignature: () => {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript("clearSignature();true;");
          }
        },
        undoStroke: () => {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript("undoStroke();true;");
          }
        },
      }),
      [webViewRef]
    );

    const renderError = (e) => {
      const { nativeEvent } = e;
      console.warn("WebView error: ", nativeEvent);
    };

    return (
      <View style={styles.webBg}>
        <WebView
          ref={webViewRef}
          useWebKit={true}
          source={source}
          onMessage={getSignature}
          javaScriptEnabled={true}
          onError={renderError}
          onLoadEnd={() => setLoading(false)}
        />
        {loading && (
          <View style={styles.loadingOverlayContainer}>
            <ActivityIndicator />
          </View>
        )}
      </View>
    );
  }
);

export default SignatureView;
