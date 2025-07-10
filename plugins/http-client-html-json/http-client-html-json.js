// Headless HTTP Client Component for Juris
const HttpClient = (props, context) => {
  
  // Base request method
  const makeRequest = async (method, url, data = {}, statePath, options = {}) => {
    try {
      const config = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // Add body for POST, PUT, PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(config.method) && data) {
        config.body = JSON.stringify(data);
      }

      // For GET and DELETE, add data as query params if provided
      if (['GET', 'DELETE'].includes(config.method) && data && Object.keys(data).length > 0) {
        const params = new URLSearchParams(data);
        url += (url.includes('?') ? '&' : '?') + params.toString();
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error(`${method.toUpperCase()} request failed:`, error);
      throw error;
    }
  };

  // HTML Methods - store HTML strings in state
  const getHtml = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('GET', url, data, statePath, options);
      const html = await response.text();
      context.setState(statePath, html);
      return html;
    } catch (error) {
      if (props.onError) props.onError(error, 'getHtml');
      throw error;
    }
  };

  const postHtml = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('POST', url, data, statePath, options);
      const html = await response.text();
      context.setState(statePath, html);
      return html;
    } catch (error) {
      if (props.onError) props.onError(error, 'postHtml');
      throw error;
    }
  };

  const updateHtml = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('PUT', url, data, statePath, options);
      const html = await response.text();
      context.setState(statePath, html);
      return html;
    } catch (error) {
      if (props.onError) props.onError(error, 'updateHtml');
      throw error;
    }
  };

  const deleteHtml = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('DELETE', url, data, statePath, options);
      const html = await response.text();
      context.setState(statePath, html);
      return html;
    } catch (error) {
      if (props.onError) props.onError(error, 'deleteHtml');
      throw error;
    }
  };

  const patchHtml = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('PATCH', url, data, statePath, options);
      const html = await response.text();
      context.setState(statePath, html);
      return html;
    } catch (error) {
      if (props.onError) props.onError(error, 'patchHtml');
      throw error;
    }
  };

  // JSON Methods - store JSON strings in state
  const getJson = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('GET', url, data, statePath, options);
      const json = await response.text(); // Store as string
      context.setState(statePath, json);
      return json;
    } catch (error) {
      if (props.onError) props.onError(error, 'getJson');
      throw error;
    }
  };

  const postJson = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('POST', url, data, statePath, options);
      const json = await response.text(); // Store as string
      context.setState(statePath, json);
      return json;
    } catch (error) {
      if (props.onError) props.onError(error, 'postJson');
      throw error;
    }
  };

  const updateJson = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('PUT', url, data, statePath, options);
      const json = await response.text(); // Store as string
      context.setState(statePath, json);
      return json;
    } catch (error) {
      if (props.onError) props.onError(error, 'updateJson');
      throw error;
    }
  };

  const deleteJson = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('DELETE', url, data, statePath, options);
      const json = await response.text(); // Store as string
      context.setState(statePath, json);
      return json;
    } catch (error) {
      if (props.onError) props.onError(error, 'deleteJson');
      throw error;
    }
  };

  const patchJson = async (url, data, statePath, options) => {
    try {
      const response = await makeRequest('PATCH', url, data, statePath, options);
      const json = await response.text(); // Store as string
      context.setState(statePath, json);
      return json;
    } catch (error) {
      if (props.onError) props.onError(error, 'patchJson');
      throw error;
    }
  };

  return {
    // Expose methods to context for use by other components
    api:{  
        // HTML methods
        getHtml,
        postHtml,
        updateHtml,
        deleteHtml,
        patchHtml,
        
        // JSON methods
        getJson,
        postJson,
        updateJson,
        deleteJson,
        patchJson
      }
  };
};

// Usage example in your Juris setup:
// const app = new Juris({
//   headlessComponents: {
//     client: { fn: HttpClient, options: { autoInit: true } }
//   }
// });
//
// Then in other components, use like:
// context.client.getHtml('/api/users', {}, 'users.list')
// context.client.postJson('/api/users', {name: 'John'}, 'users.created')