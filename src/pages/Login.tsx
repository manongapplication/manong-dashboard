import axios from "axios";
import { Key, Mail } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";

type LoginForm = {
    email: string;
    password: string;
  };

const Login: React.FC = () => {

  const baseApiUrl = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const [ messages, setMessages ] = useState('');
  const [ errorMessages, setErrorMessages ] = useState('');

  const clearMessages = () => {
    setMessages('');
    setErrorMessages('');
  }

  const onSubmit: SubmitHandler<LoginForm> = (data) => {
    axios.post(`${baseApiUrl}/login`, data)
      .then((response) => {
        clearMessages();
        if (response.data.token != null) {
          localStorage.setItem('token', response.data.token);
          setMessages('Successfully login!');
          navigate('/');
        } else {
          setErrorMessages('Failed to login. Please try again later.');
        }
        
      })
      .catch(error => {
        console.log('Error:', error);
        clearMessages();
        setErrorMessages(error.response.data.message);
      });
    
  };
  return (
    <>
      <Helmet>
        <title>Admin Login - Manong</title>
        <meta
          name="description"
          content="Login to the Manong admin dashboard to manage service requests, monitor manongs, and access administrative tools securely."
        />
      </Helmet>
      <div className="flex min-h-screen justify-center items-center">
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-bold text-center">Login</h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="card bg-base-100"
            >
              
              <div className="flex flex-col">
                <label className="input validator">
                  <Mail size={18} />
                  <input
                    {...register("email", {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                    type="email"
                    required
                    name="email"
                    placeholder="Email"
                    className="input input-bordered w-full"
                  />
                </label>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
            

              <div className="flex flex-col">
                <label className="input validator mt-4">
                  <Key size={18} />
                  <input
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                    type="password"
                    required
                    placeholder="Password"
                    min={8}
                    name="password"
                    title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
                  />
                </label>

                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <button type="submit" className="btn btn-primary mt-4">
                Login
              </button>

              <div className="messages mt-2 text-green-600 text-md text-wrap w-60 text-center flex justify-center items-center">
                {messages}
              </div>
              <div className="messages mt-2 text-red-600 text-md text-wrap w-60 text-center flex justify-center items-center">
                {errorMessages}
              </div>
            </form>
        </div>

      </div>
    </>
  )
}

export default Login;