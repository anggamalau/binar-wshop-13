import { httpRequestsTotal, httpRequestDuration } from './metrics';

export function withMetrics(handler: Function) {
  return async (request: Request) => {
    const start = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const route = url.pathname;
    
    try {
      const response = await handler(request);
      
      // Record metrics
      const duration = (Date.now() - start) / 1000;
      httpRequestDuration.observe({ method, route }, duration);
      httpRequestsTotal.inc({ method, route, status: response.status.toString() });
      
      return response;
    } catch (error) {
      // Record error metrics
      const duration = (Date.now() - start) / 1000;
      httpRequestDuration.observe({ method, route }, duration);
      httpRequestsTotal.inc({ method, route, status: '500' });
      
      throw error;
    }
  };
} 