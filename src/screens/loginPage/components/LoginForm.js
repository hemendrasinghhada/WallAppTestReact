import React, { useState, useContext, useEffect  } from 'react';

import { Formik } from 'formik';
import { LogInSchema } from '../../../validation/LogInSchema';
import { signInQuery, getCurrentUser } from '../../../api/Queries';

import LoadingSpinner from '../../../sharedComponents/LoadingSpinner';

import { UserContext } from "../../../contexts/UserContext";

import {
  saveUserToLocalStorage,
  saveTokenToLocalStorage,
  getTokenFromLocalStorage,
  getCurrentPageFromLocalStorage,
  getNextPageFromLocalStorage,
} from "../../../utils/localStorage";

import {
		Redirect,
    withRouter,
    useHistory,
	useLocation,
	Link
} from "react-router-dom";

function LoginForm(props) {

	let history = useHistory();
	let location = useLocation();

	const userState = useContext(UserContext);

	let { from } = location.state || { from: { pathname: "/User/Dashboard" } };

	const [errorMessage, setErrorMessage] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	let token = getTokenFromLocalStorage();
	const nextPage = getNextPageFromLocalStorage();

	useEffect(() => {
    if(errorMessage){
      setTimeout(() => {
        setErrorMessage("");
      }, 2000)
    }
  }, [errorMessage])
	
	const loginHandler = async (creds, resetForm) => {
    setIsLoading(true);
		try {
			const data = await signInQuery(creds);
			if(data && data.refresh || data.access){
				const userdata = await getCurrentUser({ id: data.user_id, token: data.access });
				if(userdata && userdata.status === 1){
					userState.login({ ...userdata.data, token: data.access });
					saveUserToLocalStorage(userdata.data);
				}
				saveTokenToLocalStorage(data.access);
			} 

			if(data && data.detail) {
				setErrorMessage('Credentials are invalid!');
				resetForm();
			}
			token = data.access;
			setIsLoading(false);
		} catch (e) {
			console.log(e);
			setIsLoading(false);
			resetForm();
			setErrorMessage('a network error occured');
		}
	};
	
	if (userState.isLoggedIn) {
    const page = getCurrentPageFromLocalStorage() || "/User/Dashboard";
    return <Redirect to={page} />;
  } else if (nextPage) {
    return <Redirect to={nextPage} />;
  }

  if (token) {
    return null;
  }

	return (
		<div className="common-page-wrapper">
				<div className="login-form shadow">
						<div className="card-body">
								<div className="card-head text-center">
										<h2>Login</h2>
								</div>
								<div className="card-text">
								<Formik
										initialValues={{
											username: '',
											password: ''
										}}
										validationSchema={LogInSchema}
										onSubmit={(values, { resetForm }) => {
												loginHandler(values, resetForm);
										}}
									>
										{({
											values,
											errors,
											touched,
											handleChange,
											handleBlur,
											handleSubmit,
											isSubmitting,
										}) => (
												<form onSubmit={handleSubmit}>
													<div className={`form-group ${errors.username && touched.username ? 'has-danger' : ''}`}>
														<label for="exampleInputEmail1">Username</label>
														<input 
															type="text"
															name="username"
															placeholder="Username"
															onChange={handleChange}
															onBlur={handleBlur}
															value={values.username}
															className="form-control form-control-sm" 
															id="exampleInputEmail1"
														/>
														<div className="has-error">{errors.username && touched.username && errors.username}</div>
													</div>
													<div className={`form-group ${errors.password && touched.password ? 'has-danger' : ''}`}>
															<label for="exampleInputPassword1">Password</label>
															<input 
																type="password"
																name="password"
																placeholder="Password"
																onChange={handleChange}
																onBlur={handleBlur}
																value={values.password}
																className="form-control form-control-sm" 
																id="exampleInputPassword1" 
															/>
															<div className="has-error">{errors.password && touched.password && errors.password}</div>
													</div>
													{isLoading ? (
														<div className="login-loading-wrapper">
															<LoadingSpinner />
														</div>
													) : (
														<button type="submit" className="btn btn-primary btn-block">Sign in</button>
													)}
											</form>
										)}
									</Formik>
									{errorMessage && <div style={{ marginTop: 10 }} className="alert alert-danger alert-dismissible fade show" role="alert">{errorMessage}</div>}
									<div className="sign-up">
											Don't have an account? <Link to="/Signup">Sign up</Link>
											<Link to="/Forgot-password" className="float-right">Forgot password?</Link>
									</div>
								</div>
						</div>
				</div>
		</div>
	);
}

export default withRouter(LoginForm)