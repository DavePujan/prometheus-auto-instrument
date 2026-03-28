jest.mock("@opentelemetry/api", () => {
  const span = {
    setAttribute: jest.fn(),
    end: jest.fn()
  };

  return {
    __span: span,
    trace: {
      getTracer: jest.fn(() => ({
        startSpan: jest.fn(() => span)
      }))
    }
  };
});

const otel = require("@opentelemetry/api");
const { instrumentOtel } = require("../src/plugins/otel");

test("instrumentOtel returns middleware that ends span on finish", () => {
  const middleware = instrumentOtel();
  expect(typeof middleware).toBe("function");

  const handlers = {};
  const req = { method: "GET", path: "/hello" };
  const res = {
    statusCode: 200,
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    })
  };
  const next = jest.fn();

  middleware(req, res, next);

  expect(next).toHaveBeenCalled();
  expect(typeof handlers.finish).toBe("function");

  handlers.finish();

  expect(otel.__span.setAttribute).toHaveBeenCalledWith("http.status_code", 200);
  expect(otel.__span.end).toHaveBeenCalled();
});